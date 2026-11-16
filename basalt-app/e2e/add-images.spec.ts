import { expect, test, type Page } from "@playwright/test";
import {
    openWorkspaceWith,
    readSavedBytes,
    readSavedText,
    setScopeDenied,
} from "./support";

const PNG = Array.from(
    Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
    ),
);

type Item = { name: string; bytes: number[]; type: string };

const png = (name: string): Item => ({ name, bytes: PNG, type: "image/png" });
const pdf = (name: string): Item => ({
    name,
    bytes: Array.from(new TextEncoder().encode("%PDF-1.4")),
    type: "application/pdf",
});

function option(page: Page, name: string | RegExp) {
    return page
        .getByRole("listbox", { name: "Notes" })
        .getByRole("option", { name, exact: typeof name === "string" });
}

function editor(page: Page, name: string) {
    return page.getByRole("textbox", { name });
}

async function pasteFiles(page: Page, items: Item[], text = "") {
    await page.evaluate(
        ({ items, text }) => {
            const transfer = new DataTransfer();
            for (const item of items) {
                transfer.items.add(
                    new File([Uint8Array.from(item.bytes)], item.name, {
                        type: item.type,
                    }),
                );
            }
            if (text) transfer.setData("text/plain", text);
            const target = document.querySelector(".cm-content");
            target?.dispatchEvent(
                new ClipboardEvent("paste", {
                    clipboardData: transfer,
                    bubbles: true,
                    cancelable: true,
                }),
            );
        },
        { items, text },
    );
}

async function dropFiles(page: Page, items: Item[], selector = ".cm-content") {
    return page.evaluate(
        ({ items, selector }) => {
            const transfer = new DataTransfer();
            for (const item of items) {
                transfer.items.add(
                    new File([Uint8Array.from(item.bytes)], item.name, {
                        type: item.type,
                    }),
                );
            }
            const target = document.querySelector(selector);
            const rect = target?.getBoundingClientRect();
            const event = new DragEvent("drop", {
                dataTransfer: transfer,
                bubbles: true,
                cancelable: true,
                clientX: (rect?.left ?? 0) + 4,
                clientY: (rect?.top ?? 0) + 4,
            });
            target?.dispatchEvent(event);
            return event.defaultPrevented;
        },
        { items, selector },
    );
}

async function savedBytes(page: Page, path: string) {
    return Array.from((await readSavedBytes(page, path)) ?? []);
}

test.describe("adding images by paste and drop", () => {
    test("pasting an image stores it in attachments and inserts a standard link that is saved", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();

        await pasteFiles(page, [png("shot.png")]);

        await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
        await expect
            .poll(() => readSavedText(page, "a.md"), { timeout: 5000 })
            .toBe("![shot](attachments/shot.png)");
        expect(await savedBytes(page, "attachments/shot.png")).toEqual(PNG);
        await expect
            .poll(() =>
                page
                    .locator("img.cm-image-preview")
                    .evaluate((img: HTMLImageElement) => img.naturalWidth),
            )
            .toBeGreaterThan(0);
        await page.keyboard.press("Control+Home");
        await expect(editor(page, "a")).toContainText(
            "![shot](attachments/shot.png)",
        );
    });

    test("an unnamed clipboard image is named by time and a second paste gets a numbered name", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();

        await pasteFiles(page, [png("shot.png")]);
        await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
        await pasteFiles(page, [png("shot.png")]);
        await expect(page.locator("img.cm-image-preview")).toHaveCount(2);
        await pasteFiles(page, [{ ...png(""), name: "" }]);
        await expect(page.locator("img.cm-image-preview")).toHaveCount(3);

        const files = await page.evaluate(
            () => window.__basaltTestFs?.listFiles() ?? [],
        );
        expect(files).toEqual(
            expect.arrayContaining([
                "attachments/shot.png",
                "attachments/shot 1.png",
            ]),
        );
        expect(
            files.filter((file) =>
                /^attachments\/Pasted image \d{14}\.png$/.test(file),
            ),
        ).toHaveLength(1);
    });

    test("pasting into a note in a sub-folder writes a relative link", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "Projects/Plan.md": "" });
        await option(page, /Plan/).click();

        await pasteFiles(page, [png("shot.png")]);

        await expect
            .poll(() => readSavedText(page, "Projects/Plan.md"), {
                timeout: 5000,
            })
            .toBe("![shot](../attachments/shot.png)");
        expect(await savedBytes(page, "attachments/shot.png")).toEqual(PNG);
    });

    test("pasting two images and a PDF in the middle of a line inserts two links on their own lines and one notice", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();
        await page.keyboard.type("left right");
        await page.keyboard.press("Home");
        for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");

        await pasteFiles(page, [
            png("one.png"),
            pdf("doc.pdf"),
            png("two.png"),
        ]);

        await expect(page.locator("img.cm-image-preview")).toHaveCount(2);
        await expect
            .poll(() => readSavedText(page, "a.md"), { timeout: 5000 })
            .toBe(
                "left\n![one](attachments/one.png)\n![two](attachments/two.png)\n right",
            );
        await expect(page.locator(".bs-alert")).toContainText(
            "1 file was not added: This file format is not supported.",
        );
        expect(
            await page.evaluate(
                () => window.__basaltTestFs?.listFiles().sort() ?? [],
            ),
        ).toEqual(["a.md", "attachments/one.png", "attachments/two.png"]);
    });

    test("dropping an image onto the editor inserts its link and the notice can be dismissed", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();

        const handled = await dropFiles(page, [png("d.png"), pdf("x.pdf")]);

        expect(handled).toBe(true);
        await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
        const notice = page.locator(".bs-alert");
        await expect(notice).toContainText("1 file was not added");
        await notice.getByRole("button", { name: "Dismiss notice" }).click();
        await expect(page.locator(".bs-alert")).toHaveCount(0);
    });

    test("dropping a file outside the editor does nothing and is not left to navigate", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "keep" });
        await option(page, "a").click();
        const url = page.url();

        const prevented = await dropFiles(page, [png("x.png")], "body");

        expect(prevented).toBe(true);
        expect(page.url()).toBe(url);
        await expect(editor(page, "a")).toContainText("keep");
        expect(
            await page.evaluate(() => window.__basaltTestFs?.listFiles() ?? []),
        ).toEqual(["a.md"]);
    });

    test("a read-only workspace shows a notice and inserts nothing", async ({
        page,
    }) => {
        await openWorkspaceWith(
            page,
            "/work/W",
            { "a.md": "text" },
            { readOnly: true },
        );
        await option(page, "a").click();

        await pasteFiles(page, [png("x.png")]);

        await expect(page.locator(".bs-alert")).toContainText(
            "The workspace folder is read-only. Nothing was changed.",
        );
        await expect(editor(page, "a")).toHaveText("text");
        expect(
            await page.evaluate(() => window.__basaltTestFs?.listFiles() ?? []),
        ).toEqual(["a.md"]);
    });

    test("pasting text stays an ordinary text paste, even with an image rendition", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();

        await pasteFiles(page, [png("rendition.png")], "plain words");

        await expect(editor(page, "a")).toContainText("plain words");
        expect(
            await page.evaluate(() => window.__basaltTestFs?.listFiles() ?? []),
        ).toEqual(["a.md"]);
    });

    test("a denied folder scope shows a notice and a banner, and granting access keeps the open note", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();
        await page.keyboard.type("typed text");
        await setScopeDenied(page, "attachments");

        await dropFiles(page, [png("d.png")]);

        await expect(
            page.locator(".bs-alert", {
                hasText:
                    "Basalt does not have access to this part of the workspace folder. Nothing was changed.",
            }),
        ).toBeVisible();
        await expect(
            page.getByText("Basalt needs access to the whole workspace folder"),
        ).toBeVisible();
        expect(
            await page.evaluate(() => window.__basaltTestFs?.listFiles() ?? []),
        ).not.toContain("attachments/d.png");

        await page.getByRole("button", { name: "Grant access" }).click();

        await expect(
            page.getByText("Basalt needs access to the whole workspace folder"),
        ).toHaveCount(0);
        await expect(editor(page, "a")).toContainText("typed text");
        await expect(option(page, "a")).toBeVisible();

        await dropFiles(page, [png("d.png")]);

        await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
        expect(await savedBytes(page, "attachments/d.png")).toEqual(PNG);
        await expect
            .poll(async () =>
                (await readSavedText(page, "a.md"))
                    ?.replace(/\n?!\[d\]\(attachments\/d\.png\)\n?/, "")
                    .trim(),
            )
            .toBe("typed text");
    });
    test("dropping far below the text in an empty note inserts the link and writes the file", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();
        await expect(editor(page, "a")).toBeVisible();

        const box = await page.locator(".cm-editor").boundingBox();
        const main = await page.locator("main").boundingBox();
        expect(box).not.toBeNull();
        expect(main).not.toBeNull();
        expect(box?.height ?? 0).toBeGreaterThan((main?.height ?? 0) * 0.7);

        const prevented = await page.evaluate(
            ({ items }) => {
                const transfer = new DataTransfer();
                for (const item of items) {
                    transfer.items.add(
                        new File([Uint8Array.from(item.bytes)], item.name, {
                            type: item.type,
                        }),
                    );
                }
                const rect = document
                    .querySelector(".cm-editor")
                    ?.getBoundingClientRect();
                const target = document.elementFromPoint(
                    (rect?.left ?? 0) + 40,
                    (rect?.bottom ?? 0) - 30,
                );
                const event = new DragEvent("drop", {
                    dataTransfer: transfer,
                    bubbles: true,
                    cancelable: true,
                    clientX: (rect?.left ?? 0) + 40,
                    clientY: (rect?.bottom ?? 0) - 30,
                });
                target?.dispatchEvent(event);
                return {
                    prevented: event.defaultPrevented,
                    inEditor: Boolean(target?.closest(".cm-editor")),
                };
            },
            { items: [png("low.png")] },
        );

        expect(prevented).toEqual({ prevented: true, inEditor: true });
        await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
        expect(await savedBytes(page, "attachments/low.png")).toEqual(PNG);
        await expect
            .poll(() => readSavedText(page, "a.md"), { timeout: 5000 })
            .toBe("![low](attachments/low.png)");
    });

    test("a long note scrolls inside the editor and not in the pane", async ({
        page,
    }) => {
        const lines = Array.from({ length: 200 }, (_, i) => `line ${i}`);
        await openWorkspaceWith(page, "/work/W", { "a.md": lines.join("\n") });
        await option(page, "a").click();
        await expect(editor(page, "a")).toContainText("line 0");

        const metrics = await page.evaluate(() => {
            const main = document.querySelector("main");
            const scroller = document.querySelector(".cm-scroller");
            return {
                paneOverflows:
                    (main?.scrollHeight ?? 0) > (main?.clientHeight ?? 0) + 1,
                scrollerOverflows:
                    (scroller?.scrollHeight ?? 0) >
                    (scroller?.clientHeight ?? 0) + 1,
            };
        });

        expect(metrics).toEqual({
            paneOverflows: false,
            scrollerOverflows: true,
        });
    });
});
