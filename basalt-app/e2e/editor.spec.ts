import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
    listFiles,
    openWorkspaceWith,
    readSavedBytes,
    readSavedText,
} from "./support";

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

async function openWorkspaceWithFrozenClock(
    page: Page,
    files: Record<string, string | Uint8Array>,
) {
    await installClock(page);
    await openWorkspaceWith(page, "/work/W", files);
    await freezeClock(page);
}

test.describe("note editor", () => {
    test(
        "shows the note text in a single focused editing surface when a note is opened from the list",
        { tag: "@EDITOR-001" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "# Alpha\n\ntext",
            });

            await option(page, "a").click();

            await expect(editor(page, "a")).toContainText("# Alpha");
            await expect(editor(page, "a")).toBeFocused();
            await expect(page.getByText("No note open")).toHaveCount(0);
            await expect(page.locator(".cm-editor")).toHaveCount(1);
            await expect(page.locator("textarea")).toHaveCount(0);
        },
    );

    test(
        "saves exactly the typed source under the first heading's file name once the autosave delay passes",
        { tag: "@EDITOR-002" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "" });
            await option(page, "a").click();
            await editor(page, "a").click();
            await page.keyboard.type("# Title\n\nplain *text*\nsecond line");

            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect
                .poll(() => readSavedText(page, "Title.md"))
                .toBe("# Title\n\nplain *text*\nsecond line");
            expect(await listFiles(page)).toEqual(["Title.md"]);
        },
    );

    test(
        "focuses the editor of the new Untitled note so typing starts at once when New note is used",
        { tag: "@EDITOR-003" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "x" });

            await page
                .getByRole("banner")
                .getByRole("button", { name: "New note" })
                .click();
            await expect(editor(page, "Untitled")).toBeFocused();
            await page.keyboard.type("typed at once");
            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect
                .poll(() => readSavedText(page, "Untitled.md"))
                .toBe("# typed at once");
        },
    );

    test(
        "focuses the editor of the new Untitled note so typing starts at once when Ctrl+N is pressed",
        { tag: "@EDITOR-004" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "x" });

            await page.keyboard.press("Control+n");
            await expect(editor(page, "Untitled")).toBeFocused();
            await page.keyboard.type("hello");
            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect
                .poll(() => readSavedText(page, "Untitled.md"))
                .toBe("# hello");
        },
    );
});

test.describe("tabs", () => {
    test(
        "opens one tab per note and focuses the existing tab when an already open note is chosen again",
        { tag: "@TABS-001" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "A text",
                "b.md": "B text",
                "projects/Roadmap.md": "R",
            });
            await option(page, "a").click();
            await option(page, "b").click();
            await option(page, "projects").click();
            await option(page, "Roadmap").click();
            await expect(page.getByRole("tab")).toHaveText([
                "a",
                "b",
                "Roadmap",
            ]);

            await option(page, "a").click();

            await expect(page.getByRole("tab")).toHaveCount(3);
            await expect(tab(page, "a")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await expect(tab(page, "b")).toHaveAttribute(
                "aria-selected",
                "false",
            );
            await expect(editor(page, "a")).toBeVisible();
            await expect(editor(page, "a")).toBeFocused();
            await expect(editor(page, "b")).toBeHidden();
        },
    );

    test(
        "shows the unsaved dot while typing and removes it after the autosave delay passes",
        { tag: "@TABS-002" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "base" });
            await option(page, "a").click();
            await editor(page, "a").click();

            await page.keyboard.type(" more");

            await expect(
                page.getByRole("tab", { name: "a not saved" }),
            ).toBeVisible();
            await expect(page.locator("[data-unsaved-dot]")).toHaveCount(1);
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect(tab(page, "a")).toBeVisible();
            await expect(page.locator("[data-unsaved-dot]")).toHaveCount(0);
            expect(await readSavedText(page, "a.md")).toBe("base more");
        },
    );

    test(
        "keeps the text and the undo history of each tab separate when switching between tabs",
        { tag: "@TABS-003" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "a.md": "",
                "b.md": "",
            });
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
        },
    );

    test(
        "closes the clicked tab and keeps the others when its Close button is used",
        { tag: "@TABS-004" },
        async ({ page }) => {
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
            await expect(page.getByRole("tab")).toHaveCount(2);
        },
    );

    test(
        "closes a tab with the middle mouse button and shows No note open after the last tab is closed",
        { tag: "@TABS-005" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "1",
                "b.md": "2",
            });
            await option(page, "a").click();
            await option(page, "b").click();

            await tab(page, "a").click({ button: "middle" });

            await expect(page.getByRole("tab")).toHaveText(["b"]);
            await expect(tab(page, "b")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await tab(page, "b").click({ button: "middle" });
            await expect(page.getByRole("tab")).toHaveCount(0);
            await expect(page.getByText("No note open")).toBeVisible();
        },
    );

    test(
        "writes the typed text to disk before the tab closes when a dirty tab is closed",
        { tag: "@TABS-006" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "" });
            await option(page, "a").click();
            await page.keyboard.type("quick");
            expect(await readSavedText(page, "a.md")).toBe("");

            await page.getByRole("button", { name: /Close a/ }).click();

            await expect(page.getByRole("tab")).toHaveCount(0);
            expect(await readSavedText(page, "a.md")).toBe("quick");
        },
    );

    test(
        "selects and focuses the neighbouring tab with the arrow, Home and End keys",
        { tag: "@TABS-007" },
        async ({ page }) => {
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
            await expect(tab(page, "b")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await expect(editor(page, "b")).toBeVisible();
            await page.keyboard.press("Home");
            await expect(tab(page, "a")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await page.keyboard.press("End");
            await expect(tab(page, "c")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await page.keyboard.press("ArrowRight");
            await expect(tab(page, "a")).toBeFocused();
        },
    );

    test(
        "restores the open tabs in order and the active tab after a reload",
        { tag: "@TABS-008" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "A",
                "b.md": "B",
                "c.md": "C",
            });
            await option(page, "a").click();
            await option(page, "c").click();
            await option(page, "b").click();
            await tab(page, "c").click();
            await expect(tab(page, "c")).toHaveAttribute(
                "aria-selected",
                "true",
            );

            await page.reload();

            await expect(page.getByRole("tab")).toHaveText(["a", "c", "b"]);
            await expect(tab(page, "c")).toHaveAttribute(
                "aria-selected",
                "true",
            );
            await expect(editor(page, "c")).toBeVisible();
            await expect(editor(page, "c")).toContainText("C");
        },
    );

    test(
        "drops the tab of a note that was deleted outside the app when the app is reloaded",
        { tag: "@TABS-009" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "A",
                "b.md": "B",
            });
            await option(page, "a").click();
            await option(page, "b").click();
            await page.evaluate(() => {
                window.__basaltTestFs?.externalDelete("a.md");
            });

            await page.reload();

            await expect(page.getByRole("tab")).toHaveText(["b"]);
            await expect(tab(page, "b")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        },
    );
});

test.describe("note errors", () => {
    test(
        "shows the too-large message, mounts no editor and never writes the file when a note over 5 MiB is opened",
        { tag: "@EDITOR-005" },
        async ({ page }) => {
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
            const saved = await page.evaluate(() => {
                const bytes = window.__basaltTestFs?.readBytes("big.md");
                const expected = "a".charCodeAt(0);
                return {
                    length: bytes?.length,
                    unchanged: bytes?.every((byte) => byte === expected),
                };
            });
            expect(saved).toEqual({
                length: MAX_NOTE_BYTES + 1,
                unchanged: true,
            });
        },
    );

    test(
        "shows the not-UTF-8 message and never writes the file when a note with invalid bytes is opened and typed into",
        { tag: "@EDITOR-006" },
        async ({ page }) => {
            const bytes = [0xff, 0xfe, 0x41, 0x80];
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", {
                "bin.md": Uint8Array.from(bytes),
            });
            await freezeClock(page);
            await option(page, "bin").click();
            await expect(
                page.getByText(
                    "This file is not UTF-8 text, so Basalt does not open it. The file is never changed.",
                ),
            ).toBeVisible();
            await expect(page.locator(".cm-editor")).toHaveCount(0);

            await page.keyboard.type("typed");
            await advanceClock(page, AUTOSAVE_DELAY_MS * 2);

            expect(await readSavedBytes(page, "bin.md")).toEqual(bytes);
        },
    );

    test(
        "closes the error tab and keeps other notes working when a note that cannot be opened is closed",
        { tag: "@EDITOR-007" },
        async ({ page }) => {
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
        },
    );
});

test.describe("live preview", () => {
    test(
        "renders a line once the cursor leaves it and shows the source again on the line with the cursor",
        { tag: "@EDITOR-008" },
        async ({ page }) => {
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
        },
    );

    test(
        "keeps one editing surface and saves the exact typed source when formatted Markdown is typed",
        { tag: "@EDITOR-009" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "" });
            await option(page, "a").click();
            const source = "# Head\n\n`code` and **strong**\n[t](u)\n> quote";

            await page.keyboard.type(source);
            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect(page.locator(".cm-editor")).toHaveCount(1);
            await expect(
                page.locator("textarea, input[type=text]"),
            ).toHaveCount(0);
            await expect(page.locator(".cm-lp-code")).toHaveText("code");
            await expect(page.locator(".cm-lp-strong")).toHaveText("strong");
            await expect
                .poll(() => readSavedText(page, "Head.md"))
                .toBe(source);
        },
    );

    test(
        "shows the source of the first line and renders task items when a note is opened",
        { tag: "@EDITOR-010" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "# Alpha\n\n- [ ] todo\n- [x] done",
            });

            await option(page, "a").click();

            await expect(page.locator(".cm-line").nth(0)).toHaveText("# Alpha");
            await expect(page.locator(".cm-lp-task")).toHaveCount(2);
            await expect(page.locator(".cm-lp-task-done")).toHaveCount(1);
        },
    );

    test(
        "hides the fence lines and shows the code with its blank line when the cursor is outside a fenced block",
        { tag: "@EDITOR-011" },
        async ({ page }) => {
            const source = "intro\n\n```js\n\nTest\n```\n\nend";
            await openWorkspaceWith(page, "/work/W", { "a.md": source });

            await option(page, "a").click();

            const lines = page.locator(".cm-line");
            await expect(lines).toHaveCount(8);
            await expect(lines.nth(2)).toHaveText("");
            await expect(lines.nth(2)).toHaveClass(/cm-lp-codeblock/);
            await expect(lines.nth(3)).toHaveText("");
            await expect(lines.nth(4)).toHaveText("Test");
            await expect(lines.nth(5)).toHaveText("");
            await expect(editor(page, "a")).not.toContainText("```");
            expect(await readSavedText(page, "a.md")).toBe(source);
        },
    );

    test(
        "shows only the source of the fence line the cursor is on and hides the other fence line",
        { tag: "@EDITOR-012" },
        async ({ page }) => {
            const source = "intro\n\n```js\n\nTest\n```\n\nend";
            await openWorkspaceWith(page, "/work/W", { "a.md": source });
            await option(page, "a").click();
            const lines = page.locator(".cm-line");
            await expect(lines).toHaveCount(8);

            await lines.nth(2).click();
            await expect(lines.nth(2)).toHaveText("```js");
            await expect(lines.nth(5)).toHaveText("");

            await lines.nth(5).click();
            await expect(lines.nth(5)).toHaveText("```");
            await expect(lines.nth(2)).toHaveText("");

            await lines.nth(4).click();
            await expect(lines.nth(2)).toHaveText("");
            await expect(lines.nth(5)).toHaveText("");
            expect(await readSavedText(page, "a.md")).toBe(source);
        },
    );

    test(
        "shows the source of every fence line a selection touches",
        { tag: "@EDITOR-013" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "~~~\ncode\n~~~\nend",
            });
            await option(page, "a").click();
            const lines = page.locator(".cm-line");
            await expect(lines.nth(0)).toHaveText("~~~");
            await lines.nth(3).click();
            await expect(lines.nth(0)).toHaveText("");
            await expect(lines.nth(2)).toHaveText("");

            await page.keyboard.press("Shift+ArrowUp");
            await page.keyboard.press("Shift+ArrowUp");
            await page.keyboard.press("Shift+ArrowUp");

            await expect(lines.nth(0)).toHaveText("~~~");
            await expect(lines.nth(2)).toHaveText("~~~");
        },
    );

    test(
        "keeps the content of an unclosed fence and shows its opening line source when the cursor is put on it",
        { tag: "@EDITOR-014" },
        async ({ page }) => {
            const source = "intro\n```\nkept text";
            await openWorkspaceWith(page, "/work/W", { "a.md": source });
            await option(page, "a").click();
            const lines = page.locator(".cm-line");
            await expect(lines.nth(1)).toHaveText("");
            await expect(lines.nth(2)).toHaveText("kept text");

            await lines.nth(1).click();

            await expect(lines.nth(1)).toHaveText("```");
            expect(await readSavedText(page, "a.md")).toBe(source);
        },
    );

    test(
        "renders escaped characters literally off the active line and keeps the backslashes in the file",
        { tag: "@EDITOR-015" },
        async ({ page }) => {
            const source = "intro\n\\*star\\* and \\`tick\n`code \\*kept`\nend";
            await openWorkspaceWith(page, "/work/W", { "a.md": source });
            await option(page, "a").click();
            const lines = page.locator(".cm-line");
            await expect(lines.nth(1)).toHaveText("*star* and `tick");
            await expect(lines.nth(2)).toHaveText("code \\*kept");

            await lines.nth(1).click();
            await expect(lines.nth(1)).toHaveText("\\*star\\* and \\`tick");

            await lines.nth(3).click();
            await expect(lines.nth(1)).toHaveText("*star* and `tick");
            expect(await readSavedText(page, "a.md")).toBe(source);
        },
    );
});
