import { expect, test, type Page } from "@playwright/test";
import { openWorkspaceWith, readSavedBytes, readSavedText } from "./support";

const MAX_NOTE_BYTES = 5 * 1024 * 1024;

function option(page: Page, name: string | RegExp) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: typeof name === "string" });
}

function editor(page: Page, name: string) {
    return page.getByRole("textbox", { name });
}

function tab(page: Page, name: string) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return page.getByRole("tab", {
        name: new RegExp(`^${escaped}( not saved)?$`),
    });
}

async function readOnDisk(page: Page, path: string) {
    return readSavedText(page, path);
}

test.describe("note editor", () => {
    test("opens a note from the list with its text in the editor", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "# Alpha\n\ntext" });

        await option(page, "a").click();

        await expect(editor(page, "a")).toContainText("# Alpha");
        await expect(editor(page, "a")).toBeFocused();
        await expect(page.getByText("No note open")).toHaveCount(0);
        await expect(page.locator(".cm-editor")).toHaveCount(1);
        await expect(page.locator("textarea")).toHaveCount(0);
    });

    test("saves exactly the typed source after the autosave delay", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();

        await editor(page, "a").click();
        await page.keyboard.type("# Title\n\nplain *text*\nsecond line");

        await expect
            .poll(() => readOnDisk(page, "a.md"), { timeout: 5000 })
            .toBe("# Title\n\nplain *text*\nsecond line");
        await expect(page.locator("textarea, input[type=text]")).toHaveCount(0);
    });

    test("New note puts the cursor in the editor so typing works at once", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "x" });

        await page
            .getByRole("banner")
            .getByRole("button", { name: "New note" })
            .click();
        await expect(editor(page, "Untitled")).toBeFocused();
        await page.keyboard.type("typed at once");

        await expect
            .poll(() => readOnDisk(page, "Untitled.md"), { timeout: 5000 })
            .toBe("typed at once");
    });

    test("Ctrl+N opens a note with the cursor in the editor", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "x" });

        await page.keyboard.press("Control+n");
        await expect(editor(page, "Untitled")).toBeFocused();
        await page.keyboard.type("hello");

        await expect
            .poll(() => readOnDisk(page, "Untitled.md"), { timeout: 5000 })
            .toBe("hello");
    });
});

test.describe("tabs", () => {
    test("opens one tab per note and focuses the tab of an already open note", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "A text",
            "b.md": "B text",
            "projects/Roadmap.md": "R",
        });

        await option(page, "a").click();
        await option(page, "b").click();
        await option(page, "projects").click();
        await option(page, "Roadmap").click();
        await expect(page.getByRole("tab")).toHaveText(["a", "b", "Roadmap"]);

        await option(page, "a").click();

        await expect(page.getByRole("tab")).toHaveCount(3);
        await expect(tab(page, "a")).toHaveAttribute("aria-selected", "true");
        await expect(tab(page, "b")).toHaveAttribute("aria-selected", "false");
        await expect(editor(page, "a")).toBeVisible();
        await expect(editor(page, "a")).toBeFocused();
        await expect(editor(page, "b")).toBeHidden();
    });

    test("shows a dot while typing and clears it after the save", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "base" });
        await option(page, "a").click();
        await editor(page, "a").click();

        await page.keyboard.type(" more");

        await expect(
            page.getByRole("tab", { name: "a not saved" }),
        ).toBeVisible();
        await expect(page.locator("[data-unsaved-dot]")).toHaveCount(1);
        await expect(tab(page, "a")).toBeVisible({ timeout: 5000 });
        await expect(page.locator("[data-unsaved-dot]")).toHaveCount(0);
        expect(await readOnDisk(page, "a.md")).toBe("base more");
    });

    test("keeps undo history and text per tab while switching", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "", "b.md": "" });
        await option(page, "a").click();
        await page.keyboard.type("aaa");
        await option(page, "b").click();
        await page.keyboard.type("bbb");

        await tab(page, "a").click();
        await expect(editor(page, "a")).toContainText("aaa");
        await editor(page, "a").click();
        await page.keyboard.press("Control+z");

        await expect(editor(page, "a")).not.toContainText("aaa");
        await tab(page, "b").click();
        await expect(editor(page, "b")).toContainText("bbb");
    });

    test("closes a tab with its button and with the middle mouse button", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "1",
            "b.md": "2",
            "c.md": "3",
        });
        await option(page, "a").click();
        await option(page, "b").click();
        await option(page, "c").click();

        await page.getByRole("button", { name: "Close c" }).click();
        await expect(page.getByRole("tab")).toHaveText(["a", "b"]);
        await tab(page, "a").click({ button: "middle" });

        await expect(page.getByRole("tab")).toHaveText(["b"]);
        await expect(tab(page, "b")).toHaveAttribute("aria-selected", "true");
        await tab(page, "b").click({ button: "middle" });
        await expect(page.getByRole("tab")).toHaveCount(0);
        await expect(page.getByText("No note open")).toBeVisible();
    });

    test("saves a dirty note before its tab closes", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();
        await page.keyboard.type("quick");

        await page.getByRole("button", { name: /Close a/ }).click();

        await expect(page.getByRole("tab")).toHaveCount(0);
        expect(await readOnDisk(page, "a.md")).toBe("quick");
    });

    test("moves between tabs with the arrow keys", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "A",
            "b.md": "B",
            "c.md": "C",
        });
        await option(page, "a").click();
        await option(page, "b").click();
        await option(page, "c").click();
        await tab(page, "c").focus();

        await page.keyboard.press("ArrowLeft");
        await expect(tab(page, "b")).toBeFocused();
        await expect(tab(page, "b")).toHaveAttribute("aria-selected", "true");
        await expect(editor(page, "b")).toBeVisible();
        await page.keyboard.press("Home");
        await expect(tab(page, "a")).toHaveAttribute("aria-selected", "true");
        await page.keyboard.press("End");
        await expect(tab(page, "c")).toHaveAttribute("aria-selected", "true");
        await page.keyboard.press("ArrowRight");
        await expect(tab(page, "a")).toBeFocused();
    });

    test("a reload restores the tabs and the active tab", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "A",
            "b.md": "B",
            "c.md": "C",
        });
        await option(page, "a").click();
        await option(page, "c").click();
        await option(page, "b").click();
        await tab(page, "c").click();
        await expect(tab(page, "c")).toHaveAttribute("aria-selected", "true");

        await page.reload();

        await expect(page.getByRole("tab")).toHaveText(["a", "c", "b"]);
        await expect(tab(page, "c")).toHaveAttribute("aria-selected", "true");
        await expect(editor(page, "c")).toBeVisible();
        await expect(editor(page, "c")).toContainText("C");
    });

    test("a reload drops tabs of notes that no longer exist", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "A", "b.md": "B" });
        await option(page, "a").click();
        await option(page, "b").click();
        await page.evaluate(() => {
            window.__basaltTestFs?.externalDelete("a.md");
        });

        await page.reload();

        await expect(page.getByRole("tab")).toHaveText(["b"]);
        await expect(tab(page, "b")).toHaveAttribute("aria-selected", "true");
    });
});

test.describe("note errors", () => {
    test("a too-large note shows the message, mounts no editor and is never written", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "big.md": "a".repeat(MAX_NOTE_BYTES + 1),
            "ok.md": "x",
        });

        await option(page, "big").click();

        await expect(
            page.getByText(
                "Notes over 5 MiB are not opened in the editor. The file is never changed.",
            ),
        ).toBeVisible();
        await expect(page.locator(".cm-editor")).toHaveCount(0);
        await expect(tab(page, "big")).toBeVisible();
        expect((await readSavedBytes(page, "big.md"))?.length).toBe(
            MAX_NOTE_BYTES + 1,
        );
    });

    test("a note that is not UTF-8 shows the message and is never written", async ({
        page,
    }) => {
        const bytes = [0xff, 0xfe, 0x41, 0x80];
        await openWorkspaceWith(page, "/work/W", {
            "bin.md": Uint8Array.from(bytes),
        });

        await option(page, "bin").click();

        await expect(
            page.getByText(
                "This file is not UTF-8 text, so Basalt does not open it. The file is never changed.",
            ),
        ).toBeVisible();
        await expect(page.locator(".cm-editor")).toHaveCount(0);
        await page.keyboard.type("typed");
        await page.waitForTimeout(1500);
        expect(await readSavedBytes(page, "bin.md")).toEqual(bytes);
    });

    test("an error tab can be closed and other notes still work", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "bin.md": Uint8Array.from([0xff, 0xfe]),
            "ok.md": "fine",
        });
        await option(page, "bin").click();
        await option(page, "ok").click();
        await expect(editor(page, "ok")).toContainText("fine");

        await page.getByRole("button", { name: "Close bin" }).click();

        await expect(page.getByRole("tab")).toHaveText(["ok"]);
        await expect(editor(page, "ok")).toBeVisible();
    });
});

test.describe("live preview", () => {
    test("renders a line once the cursor leaves it and shows source on the cursor line", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();

        await page.keyboard.type("## Title\n**bold** and *em*\nlast");

        const lines = page.locator(".cm-line");
        await expect(lines.nth(0)).toHaveText("Title");
        await expect(lines.nth(0)).toHaveClass(/cm-lp-h2/);
        await expect(lines.nth(1)).toHaveText("bold and em");
        await expect(lines.nth(2)).toHaveText("last");

        await page.keyboard.press("ArrowUp");
        await expect(lines.nth(1)).toHaveText("**bold** and *em*");
        await expect(lines.nth(0)).toHaveText("Title");

        await page.keyboard.press("ArrowUp");
        await expect(lines.nth(0)).toHaveText("## Title");
        await expect(lines.nth(1)).toHaveText("bold and em");
    });

    test("keeps one editing surface and saves the exact typed source", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();
        const source = "# Head\n\n`code` and **strong**\n[t](u)\n> quote";

        await page.keyboard.type(source);

        await expect(page.locator(".cm-editor")).toHaveCount(1);
        await expect(page.locator("textarea, input[type=text]")).toHaveCount(0);
        await expect(page.locator(".cm-lp-code")).toHaveText("code");
        await expect(page.locator(".cm-lp-strong")).toHaveText("strong");
        await expect
            .poll(() => readOnDisk(page, "a.md"), { timeout: 5000 })
            .toBe(source);
    });

    test("shows source of an opened note on the first line and renders the rest", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "# Alpha\n\n- [ ] todo\n- [x] done",
        });

        await option(page, "a").click();

        await expect(page.locator(".cm-line").nth(0)).toHaveText("# Alpha");
        await expect(page.locator(".cm-lp-task")).toHaveCount(2);
        await expect(page.locator(".cm-lp-task-done")).toHaveCount(1);
    });
});
