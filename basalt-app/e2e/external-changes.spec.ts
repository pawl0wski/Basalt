import { expect, test, type Locator, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    WATCHER_DEBOUNCE_MS,
    advanceClock,
    externalDelete,
    externalWrite,
    freezeClock,
    installClock,
    openWorkspaceWith,
    readSavedText,
    removeRoot,
} from "./support";

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

function editor(page: Page, name: string) {
    return page.getByRole("textbox", { name });
}

function unsavedTab(page: Page) {
    return page.getByRole("tab", { name: "a not saved", exact: true });
}

function savedTab(page: Page) {
    return page.getByRole("tab", { name: "a", exact: true });
}

async function openNoteWithFrozenClock(
    page: Page,
    files: Record<string, string>,
) {
    await installClock(page);
    await openWorkspaceWith(page, "/work/W", files);
    await option(page, "a").click();
    await expect(savedTab(page)).toBeVisible();
    await freezeClock(page);
}

async function openDirty(page: Page, text = "base") {
    await openNoteWithFrozenClock(page, { "a.md": text });
    await editor(page, "a").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" mine");
    await expect(unsavedTab(page)).toBeVisible();
}

async function changeOnDisk(page: Page, text: string) {
    await externalWrite(page, "a.md", text);
    await advanceClock(page, WATCHER_DEBOUNCE_MS);
}

async function deleteOnDisk(page: Page) {
    await externalDelete(page, "a.md");
    await advanceClock(page, WATCHER_DEBOUNCE_MS);
}

async function openDirtyWithConflict(page: Page) {
    await openDirty(page);
    await changeOnDisk(page, "theirs");
    const banner = page.getByRole("alert");
    await expect(banner).toContainText("This note changed on disk");
    return banner;
}

async function openDirtyWithDeletedFile(page: Page) {
    await openDirty(page);
    await deleteOnDisk(page);
    const banner = page.getByRole("alert");
    await expect(banner).toContainText("This note was deleted or moved");
    return banner;
}

async function scrollNoteDown(page: Page) {
    const scroller = page.locator(".cm-scroller");
    await scroller.evaluate((element) => {
        element.scrollTop = 1500;
    });
    return {
        noteScrollTop: await scroller.evaluate((element) => element.scrollTop),
        mainScrollTop: await page
            .locator("main")
            .evaluate((element) => element.scrollTop),
        editorBox: await page.locator(".cm-editor").boundingBox(),
    };
}

async function openLongNoteAndType(page: Page) {
    const long = Array.from({ length: 200 }, (_, i) => `line ${i}`).join("\n");
    await openNoteWithFrozenClock(page, { "a.md": long });
    await editor(page, "a").click();
    await page.keyboard.type("!");
    return long;
}

function expectAlignedWithEditor(
    banner: { x: number; width: number } | null,
    editorBox: { x: number; width: number } | null,
) {
    expect(banner && editorBox).toBeTruthy();
    expect(Math.abs((banner?.x ?? 0) - (editorBox?.x ?? 0))).toBeLessThan(2);
    expect(
        Math.abs((banner?.width ?? 0) - (editorBox?.width ?? 0)),
    ).toBeLessThan(2);
}

async function loadFromDiskDialog(page: Page, banner: Locator) {
    await banner
        .getByRole("button", { name: "Load version from disk" })
        .click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Load the version from disk?");
    return dialog;
}

async function closeNoteDialog(page: Page, banner: Locator) {
    await banner.getByRole("button", { name: "Close note" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Close this note?");
    return dialog;
}

test.describe("external changes to the open note", () => {
    test(
        "reloads the disk text silently without a banner when the open note is clean and changes on disk",
        { tag: "@EDITOR-016" },
        async ({ page }) => {
            await openNoteWithFrozenClock(page, { "a.md": "base" });
            const statusBar = page.locator(".bs-status-bar");
            await expect(editor(page, "a")).toContainText("base");
            await expect(statusBar).toHaveText("1 word");

            await changeOnDisk(page, "from disk");

            await expect(editor(page, "a")).toContainText("from disk");
            await expect(statusBar).toHaveText("2 words");
            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(savedTab(page)).toBeVisible();
            expect(await readSavedText(page, "a.md")).toBe("from disk");
        },
    );

    test(
        "shows the conflict banner, keeps the typed text and never overwrites the disk text when a dirty note changes on disk",
        { tag: "@EDITOR-017" },
        async ({ page }) => {
            const banner = await openDirtyWithConflict(page);

            await advanceClock(page, AUTOSAVE_DELAY_MS * 2);

            await expect(banner).toContainText(
                "Saving is paused until you choose",
            );
            await expect(editor(page, "a")).toContainText("base mine");
            expect(await readSavedText(page, "a.md")).toBe("theirs");
        },
    );

    test(
        "writes the typed text and clears the banner when Keep my version is chosen on a conflict",
        { tag: "@EDITOR-018" },
        async ({ page }) => {
            const banner = await openDirtyWithConflict(page);

            await banner
                .getByRole("button", { name: "Keep my version" })
                .click();

            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(savedTab(page)).toBeVisible();
            expect(await readSavedText(page, "a.md")).toBe("base mine");
        },
    );

    test(
        "keeps the typed text and the disk text when the Load version from disk confirmation is cancelled with Escape",
        { tag: "@EDITOR-019" },
        async ({ page }) => {
            const banner = await openDirtyWithConflict(page);

            const dialog = await loadFromDiskDialog(page, banner);

            await expect(dialog).toContainText(
                'Your unsaved changes in "a" will be lost.',
            );
            await expect(
                dialog.getByRole("button", { name: "Cancel" }),
            ).toBeFocused();
            await page.keyboard.press("Escape");
            await expect(dialog).toHaveCount(0);
            await expect(editor(page, "a")).toContainText("base mine");
            await expect(banner).toContainText("This note changed on disk");
            expect(await readSavedText(page, "a.md")).toBe("theirs");
        },
    );

    test(
        "replaces the typed text with the disk text and clears the banner when Load version from disk is confirmed",
        { tag: "@EDITOR-020" },
        async ({ page }) => {
            const banner = await openDirtyWithConflict(page);
            const dialog = await loadFromDiskDialog(page, banner);

            await dialog
                .getByRole("button", { name: "Load version from disk" })
                .click();

            await expect(editor(page, "a")).toContainText("theirs");
            await expect(editor(page, "a")).not.toContainText("mine");
            await expect(page.getByRole("alert")).toHaveCount(0);
            expect(await readSavedText(page, "a.md")).toBe("theirs");
        },
    );

    test(
        "shows the deleted-file banner, keeps the typed text and does not recreate the file when a dirty note is deleted on disk",
        { tag: "@EDITOR-021" },
        async ({ page }) => {
            const banner = await openDirtyWithDeletedFile(page);

            await advanceClock(page, AUTOSAVE_DELAY_MS * 2);

            await expect(banner).toContainText("Saving is paused");
            expect(await readSavedText(page, "a.md")).toBeNull();
            await expect(editor(page, "a")).toContainText("base mine");
        },
    );

    test(
        "recreates the file with the typed text and clears the banner when Save again here is chosen",
        { tag: "@EDITOR-022" },
        async ({ page }) => {
            const banner = await openDirtyWithDeletedFile(page);

            await banner
                .getByRole("button", { name: "Save again here" })
                .click();

            await expect(page.getByRole("alert")).toHaveCount(0);
            expect(await readSavedText(page, "a.md")).toBe("base mine");
            await expect(savedTab(page)).toBeVisible();
        },
    );

    test(
        "asks before closing with Cancel focused and keeps the note when Cancel is chosen on a deleted dirty note",
        { tag: "@EDITOR-023" },
        async ({ page }) => {
            const banner = await openDirtyWithDeletedFile(page);

            const dialog = await closeNoteDialog(page, banner);

            await expect(dialog).toContainText(
                '"a" was deleted or moved. Your unsaved changes will be lost.',
            );
            await expect(
                dialog.getByRole("button", { name: "Cancel" }),
            ).toBeFocused();
            await dialog.getByRole("button", { name: "Cancel" }).click();
            await expect(dialog).toHaveCount(0);
            await expect(page.getByRole("tab")).toHaveCount(1);
            await expect(editor(page, "a")).toContainText("base mine");
        },
    );

    test(
        "closes the tab and shows No note open when Close note is confirmed on a deleted dirty note",
        { tag: "@EDITOR-024" },
        async ({ page }) => {
            const banner = await openDirtyWithDeletedFile(page);
            const dialog = await closeNoteDialog(page, banner);

            await dialog.getByRole("button", { name: "Close note" }).click();

            await expect(page.getByRole("tab")).toHaveCount(0);
            await expect(page.getByText("No note open")).toBeVisible();
        },
    );

    test(
        "keeps the tab and the typed text when the Close note confirmation is cancelled with Escape",
        { tag: "@EDITOR-025" },
        async ({ page }) => {
            const banner = await openDirtyWithDeletedFile(page);
            await closeNoteDialog(page, banner);

            await page.keyboard.press("Escape");

            await expect(page.getByRole("alertdialog")).toHaveCount(0);
            await expect(page.getByRole("tab")).toHaveCount(1);
            await expect(editor(page, "a")).toContainText("base mine");
        },
    );

    test(
        "keeps the conflict banner at the top of the editor and as wide as the text column while the note scrolls",
        { tag: "@EDITOR-026" },
        async ({ page }) => {
            const long = await openLongNoteAndType(page);
            await changeOnDisk(page, `${long}\nelse`);
            const banner = page.getByRole("alert");
            await expect(banner).toContainText("This note changed on disk");
            const yBefore = (await banner.boundingBox())?.y ?? -1;

            const scrolled = await scrollNoteDown(page);

            expect(scrolled.noteScrollTop).toBeGreaterThan(0);
            expect(scrolled.mainScrollTop).toBe(0);
            expect((await banner.boundingBox())?.y).toBe(yBefore);
            expectAlignedWithEditor(
                await banner.boundingBox(),
                scrolled.editorBox,
            );
        },
    );

    test(
        "keeps the deleted-file banner at the top of the editor and as wide as the text column while the note scrolls",
        { tag: "@EDITOR-027" },
        async ({ page }) => {
            await openLongNoteAndType(page);
            await deleteOnDisk(page);
            const banner = page.getByRole("alert");
            await expect(banner).toContainText(
                "This note was deleted or moved",
            );
            const yBefore = (await banner.boundingBox())?.y ?? -1;

            const scrolled = await scrollNoteDown(page);

            expect(scrolled.noteScrollTop).toBeGreaterThan(0);
            expect(scrolled.mainScrollTop).toBe(0);
            expect((await banner.boundingBox())?.y).toBe(yBefore);
            expectAlignedWithEditor(
                await banner.boundingBox(),
                scrolled.editorBox,
            );
        },
    );
});

test.describe("workspace folder lost", () => {
    test(
        "returns to Welcome with the unavailable notice and keeps the last workspace when the folder is lost with no unsaved text",
        { tag: "@WORKSPACE-001" },
        async ({ page }) => {
            await openNoteWithFrozenClock(page, { "a.md": "base" });
            await expect(editor(page, "a")).toContainText("base");

            await removeRoot(page);
            await advanceClock(page, WATCHER_DEBOUNCE_MS);

            await expect(page.getByText("Workspace unavailable")).toBeVisible();
            await expect(
                page.getByRole("button", { name: "Open folder as workspace" }),
            ).toBeVisible();
            const stored = await page.evaluate(() =>
                window.localStorage.getItem("basalt.memory.settings"),
            );
            expect(stored).toContain("/work/W");
        },
    );

    test(
        "keeps the editor, asks about the failed save first and then shows a banner with Retry and Change workspace when the folder is lost with unsaved text",
        { tag: "@WORKSPACE-002" },
        async ({ page }) => {
            await openDirty(page);

            await removeRoot(page);
            await advanceClock(page, WATCHER_DEBOUNCE_MS);

            const dialog = page.getByRole("alertdialog");
            await expect(dialog).toContainText('Could not save "a"');
            await expect(
                dialog.getByRole("button", { name: "Cancel" }),
            ).toBeFocused();
            await dialog.getByRole("button", { name: "Cancel" }).click();
            const banner = page.getByRole("alert");
            await expect(banner).toContainText(
                "The workspace folder is not available",
            );
            await expect(
                banner.getByRole("button", { name: "Retry" }),
            ).toBeVisible();
            await expect(
                banner.getByRole("button", { name: "Change workspace" }),
            ).toBeVisible();
            await expect(editor(page, "a")).toContainText("base mine");
        },
    );

    test(
        "asks again that the workspace folder is not available when Retry is used while the folder is still missing",
        { tag: "@WORKSPACE-003" },
        async ({ page }) => {
            await openDirty(page);
            await removeRoot(page);
            await advanceClock(page, WATCHER_DEBOUNCE_MS);
            await page
                .getByRole("alertdialog")
                .getByRole("button", { name: "Cancel" })
                .click();
            const banner = page.getByRole("alert");

            await banner.getByRole("button", { name: "Retry" }).click();

            await expect(page.getByRole("alertdialog")).toContainText(
                "The workspace folder is not available",
            );
            await expect(
                page.getByRole("textbox", { name: "a", includeHidden: true }),
            ).toContainText("base mine");
        },
    );
});
