import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
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

async function openWorkspaceWithFrozenClock(
    page: Page,
    root: string,
    files: Record<string, string>,
    flags: { readOnly?: boolean } = {},
) {
    await installClock(page);
    await openWorkspaceWith(page, root, files, flags);
    await freezeClock(page);
}

function option(page: Page, name: string | RegExp) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: typeof name === "string" });
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
    test(
        "stores a pasted image in attachments, inserts a standard Markdown link and saves it when an image is pasted",
        { tag: "@IMAGES-008" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", { "a.md": "" });
            await option(page, "a").click();

            await pasteFiles(page, [png("shot.png")]);

            await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
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
        },
    );

    test(
        "names an unnamed pasted image by time and adds a numeric suffix when a name is already taken",
        { tag: "@IMAGES-009" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", { "a.md": "" });
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
        },
    );

    test(
        "writes a link relative to the note when an image is pasted into a note in a sub-folder",
        { tag: "@IMAGES-010" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", {
                "Projects/Plan.md": "",
            });
            await option(page, "Projects").click();
            await option(page, "Plan").click();

            await pasteFiles(page, [png("shot.png")]);

            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "Projects/Plan.md"))
                .toBe("![shot](../attachments/shot.png)");
            expect(await savedBytes(page, "attachments/shot.png")).toEqual(PNG);
        },
    );

    test(
        "inserts two image links on their own lines and shows one notice for the PDF when two images and a PDF are pasted in the middle of a line",
        { tag: "@IMAGES-011" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", { "a.md": "" });
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
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe(
                    "left\n![one](attachments/one.png)\n![two](attachments/two.png)\n right",
                );
            await expect(
                page
                    .getByRole("status")
                    .filter({ hasText: "1 file was not added" }),
            ).toContainText(
                "1 file was not added: This file format is not supported.",
            );
            expect(
                await page.evaluate(
                    () => window.__basaltTestFs?.listFiles().sort() ?? [],
                ),
            ).toEqual(["a.md", "attachments/one.png", "attachments/two.png"]);
        },
    );

    test(
        "inserts the dropped image's link and lets the notice about the unsupported file be dismissed when files are dropped on the editor",
        { tag: "@IMAGES-012" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", { "a.md": "" });
            await option(page, "a").click();

            const handled = await dropFiles(page, [png("d.png"), pdf("x.pdf")]);

            expect(handled).toBe(true);
            await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
            const notice = page
                .getByRole("status")
                .filter({ hasText: "1 file was not added" });
            await expect(notice).toContainText("1 file was not added");
            await notice
                .getByRole("button", { name: "Dismiss notice" })
                .click();
            await expect(notice).toHaveCount(0);
        },
    );

    test(
        "ignores a file dropped outside the editor and prevents the browser from navigating to it",
        { tag: "@IMAGES-013" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", {
                "a.md": "keep",
            });
            await option(page, "a").click();
            const url = page.url();

            const prevented = await dropFiles(page, [png("x.png")], "body");

            expect(prevented).toBe(true);
            expect(page.url()).toBe(url);
            await expect(editor(page, "a")).toContainText("keep");
            expect(
                await page.evaluate(
                    () => window.__basaltTestFs?.listFiles() ?? [],
                ),
            ).toEqual(["a.md"]);
        },
    );

    test(
        "shows the read-only notice and inserts nothing when an image is pasted in a read-only workspace",
        { tag: "@IMAGES-014" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(
                page,
                "/work/W",
                { "a.md": "text" },
                { readOnly: true },
            );
            await option(page, "a").click();

            await pasteFiles(page, [png("x.png")]);

            await expect(
                page.getByRole("status").filter({ hasText: "read-only" }),
            ).toContainText(
                "The workspace folder is read-only. Nothing was changed.",
            );
            await expect(editor(page, "a")).toHaveText("text");
            expect(
                await page.evaluate(
                    () => window.__basaltTestFs?.listFiles() ?? [],
                ),
            ).toEqual(["a.md"]);
        },
    );

    test(
        "pastes the text and adds no file when the clipboard holds text together with an image rendition",
        { tag: "@IMAGES-015" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", { "a.md": "" });
            await option(page, "a").click();

            await pasteFiles(page, [png("rendition.png")], "plain words");

            await expect(editor(page, "a")).toContainText("plain words");
            expect(
                await page.evaluate(
                    () => window.__basaltTestFs?.listFiles() ?? [],
                ),
            ).toEqual(["a.md"]);
        },
    );

    test(
        "shows the no-access notice and banner and adds no file when the scope is denied, then adds the image and keeps the open note after access is granted",
        { tag: "@IMAGES-016" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", { "a.md": "" });
            await option(page, "a").click();
            await page.keyboard.type("typed text");
            await setScopeDenied(page, "attachments");

            await dropFiles(page, [png("d.png")]);

            await expect(
                page.getByRole("status").filter({
                    hasText:
                        "Basalt does not have access to this part of the workspace folder. Nothing was changed.",
                }),
            ).toBeVisible();
            await expect(
                page.getByText(
                    "Basalt needs access to the whole workspace folder",
                ),
            ).toBeVisible();
            expect(
                await page.evaluate(
                    () => window.__basaltTestFs?.listFiles() ?? [],
                ),
            ).not.toContain("attachments/d.png");

            await page.getByRole("button", { name: "Grant access" }).click();

            await expect(
                page.getByText(
                    "Basalt needs access to the whole workspace folder",
                ),
            ).toHaveCount(0);
            await expect(editor(page, "a")).toContainText("typed text");
            await expect(option(page, "a")).toBeVisible();

            await dropFiles(page, [png("d.png")]);

            await expect(page.locator("img.cm-image-preview")).toHaveCount(1);
            expect(await savedBytes(page, "attachments/d.png")).toEqual(PNG);
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(async () =>
                    (await readSavedText(page, "a.md"))
                        ?.replace(/\n?!\[d\]\(attachments\/d\.png\)\n?/, "")
                        .trim(),
                )
                .toBe("typed text");
        },
    );
    test(
        "inserts the link and writes the file when an image is dropped on the empty area far below the text of an empty note",
        { tag: "@IMAGES-017" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, "/work/W", { "a.md": "" });
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
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![low](attachments/low.png)");
        },
    );
});
