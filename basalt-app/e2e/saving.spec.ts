import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    failNextWrite,
    freezeClock,
    installClock,
    openWorkspaceWith,
    readSavedBytes,
    readSavedText,
    setReadOnly,
} from "./support";

const READ_ONLY = "The workspace folder is read-only. Nothing was changed.";

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
    flags: { readOnly?: boolean } = {},
) {
    await installClock(page);
    await openWorkspaceWith(page, "/work/W", files, flags);
    await option(page, "a").click();
    await expect(savedTab(page)).toBeVisible();
    await freezeClock(page);
}

async function typeAtEnd(page: Page, text: string) {
    await editor(page, "a").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(text);
}

async function openAndType(page: Page, files: Record<string, string>) {
    await openNoteWithFrozenClock(page, files);
    await typeAtEnd(page, "typed");
}

async function waitForAutosave(page: Page) {
    await advanceClock(page, AUTOSAVE_DELAY_MS);
}

test.describe("save state", () => {
    test(
        "marks the tab not saved while typing and saved again with the exact bytes on disk once the autosave delay passes",
        { tag: "@SAVING-001" },
        async ({ page }) => {
            await openNoteWithFrozenClock(page, { "a.md": "" });
            await typeAtEnd(page, "hello world");
            await expect(unsavedTab(page)).toBeVisible();
            expect(await readSavedBytes(page, "a.md")).toEqual([]);

            await waitForAutosave(page);

            await expect(savedTab(page)).toBeVisible();
            expect(await readSavedBytes(page, "a.md")).toEqual(
                Array.from(new TextEncoder().encode("hello world")),
            );
        },
    );

    test(
        "writes the typed text at once on Ctrl+S before the autosave delay has passed",
        { tag: "@SAVING-002" },
        async ({ page }) => {
            await openAndType(page, { "a.md": "" });
            await expect(unsavedTab(page)).toBeVisible();
            expect(await readSavedText(page, "a.md")).toBe("");

            await page.keyboard.press("Control+s");

            await expect(savedTab(page)).toBeVisible();
            expect(await readSavedText(page, "a.md")).toBe("typed");
        },
    );

    test(
        "shows only the word count and no save or sync wording in the status bar before and after autosave runs",
        { tag: "@STATUSBAR-001" },
        async ({ page }) => {
            await openNoteWithFrozenClock(page, { "a.md": "x" });
            const bar = page.locator(".bs-status-bar");

            await typeAtEnd(page, " y");
            await expect(unsavedTab(page)).toBeVisible();
            await expect(bar).toHaveText("2 words");
            await expect(bar).not.toContainText(/saved|saving|sync/i);

            await waitForAutosave(page);

            await expect(savedTab(page)).toBeVisible();
            await expect(bar).toHaveText("2 words");
            await expect(bar).not.toContainText(/saved|saving|sync/i);
        },
    );
});

test.describe("save errors", () => {
    test(
        "shows the could-not-save alert and keeps the typed text and the unsaved tab when the workspace is read-only",
        { tag: "@SAVING-003" },
        async ({ page }) => {
            await openNoteWithFrozenClock(
                page,
                { "a.md": "base" },
                { readOnly: true },
            );
            await typeAtEnd(page, "!");

            await waitForAutosave(page);

            const alert = page.getByRole("alert");
            await expect(alert).toContainText("Could not save the note");
            await expect(alert).toContainText(READ_ONLY);
            await expect(unsavedTab(page)).toBeVisible();
            await expect(editor(page, "a")).toContainText("base!");
            expect(await readSavedText(page, "a.md")).toBe("base");
        },
    );

    test(
        "keeps the alert and the typed text when Retry is used while the workspace is still read-only",
        { tag: "@SAVING-004" },
        async ({ page }) => {
            await openNoteWithFrozenClock(
                page,
                { "a.md": "base" },
                { readOnly: true },
            );
            await typeAtEnd(page, "!");
            await waitForAutosave(page);
            const alert = page.getByRole("alert");
            await expect(alert).toContainText(READ_ONLY);

            await alert.getByRole("button", { name: "Retry" }).click();

            await expect(alert).toContainText(READ_ONLY);
            await expect(unsavedTab(page)).toBeVisible();
            await expect(editor(page, "a")).toContainText("base!");
            expect(await readSavedText(page, "a.md")).toBe("base");
        },
    );

    test(
        "saves the typed text and clears the alert when Retry is used after the workspace is writable again",
        { tag: "@SAVING-005" },
        async ({ page }) => {
            await openNoteWithFrozenClock(
                page,
                { "a.md": "base" },
                { readOnly: true },
            );
            await typeAtEnd(page, "!");
            await waitForAutosave(page);
            const alert = page.getByRole("alert");
            await expect(alert).toContainText(READ_ONLY);
            await setReadOnly(page, false);

            await alert.getByRole("button", { name: "Retry" }).click();

            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(savedTab(page)).toBeVisible();
            expect(await readSavedText(page, "a.md")).toBe("base!");
        },
    );

    test(
        "keeps the save-failure alert at the top of the editor and as wide as the text column while the note scrolls",
        { tag: "@SAVING-006" },
        async ({ page }) => {
            const long = Array.from(
                { length: 200 },
                (_, i) => `line ${i}`,
            ).join("\n");
            await openNoteWithFrozenClock(
                page,
                { "a.md": long },
                { readOnly: true },
            );
            await editor(page, "a").click();
            await page.keyboard.type("!");
            await waitForAutosave(page);
            const alert = page.getByRole("alert");
            await expect(alert).toBeVisible();
            const scroller = page.locator(".cm-scroller");
            const yBefore = (await alert.boundingBox())?.y ?? -1;

            await scroller.evaluate((element) => {
                element.scrollTop = 1500;
            });

            const alertBox = await alert.boundingBox();
            const editorBox = await page.locator(".cm-editor").boundingBox();
            expect(alertBox && editorBox).toBeTruthy();
            expect(
                await scroller.evaluate((element) => element.scrollTop),
            ).toBeGreaterThan(0);
            expect(
                await page
                    .locator("main")
                    .evaluate((element) => element.scrollTop),
            ).toBe(0);
            expect(alertBox?.y).toBe(yBefore);
            expect(
                Math.abs((alertBox?.x ?? 0) - (editorBox?.x ?? 0)),
            ).toBeLessThan(2);
            expect(
                Math.abs((alertBox?.width ?? 0) - (editorBox?.width ?? 0)),
            ).toBeLessThan(2);
        },
    );
});

test.describe("leaving a note", () => {
    async function openDirtyNoteWithFailingSave(page: Page) {
        await openAndType(page, { "a.md": "base" });
        await failNextWrite(page);
    }

    async function closeTabA(page: Page) {
        await page.getByRole("button", { name: "Close a" }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        return dialog;
    }

    test(
        "opens the save-failed dialog with focus on Cancel when a dirty tab is closed and the save fails",
        { tag: "@SAVING-007" },
        async ({ page }) => {
            await openDirtyNoteWithFailingSave(page);

            const dialog = await closeTabA(page);

            await expect(dialog).toContainText('Could not save "a"');
            await expect(dialog).toContainText("Something went wrong.");
            await expect(
                dialog.getByRole("button", { name: "Cancel" }),
            ).toBeFocused();
        },
    );

    test(
        "keeps the tab and the typed text when Escape is pressed in the save-failed dialog",
        { tag: "@SAVING-008" },
        async ({ page }) => {
            await openDirtyNoteWithFailingSave(page);
            await closeTabA(page);

            await page.keyboard.press("Escape");

            await expect(page.getByRole("alertdialog")).toHaveCount(0);
            await expect(unsavedTab(page)).toBeVisible();
            await expect(editor(page, "a")).toContainText("basetyped");
            expect(await readSavedText(page, "a.md")).toBe("base");
        },
    );

    test(
        "closes the tab and drops the typed text when Discard changes is chosen after a failed save",
        { tag: "@SAVING-009" },
        async ({ page }) => {
            await openDirtyNoteWithFailingSave(page);
            const dialog = await closeTabA(page);

            await dialog
                .getByRole("button", { name: "Discard changes" })
                .click();

            await expect(page.getByRole("tab")).toHaveCount(0);
            await expect(page.getByText("No note open")).toBeVisible();
            expect(await readSavedText(page, "a.md")).toBe("base");
        },
    );

    test(
        "saves the typed text and closes the tab when Retry is chosen and the write now succeeds",
        { tag: "@SAVING-010" },
        async ({ page }) => {
            await openDirtyNoteWithFailingSave(page);
            const dialog = await closeTabA(page);

            await dialog.getByRole("button", { name: "Retry" }).click();

            await expect(page.getByRole("tab")).toHaveCount(0);
            expect(await readSavedText(page, "a.md")).toBe("basetyped");
        },
    );

    test(
        "closes a clean tab without opening the save-failed dialog",
        { tag: "@SAVING-011" },
        async ({ page }) => {
            await openNoteWithFrozenClock(page, { "a.md": "base" });

            await page.getByRole("button", { name: "Close a" }).click();

            await expect(page.getByRole("tab")).toHaveCount(0);
            await expect(page.getByRole("alertdialog")).toHaveCount(0);
        },
    );

    test(
        "shows the save-failed dialog and keeps the open workspace and text when changing workspace with a failing save",
        { tag: "@SAVING-012" },
        async ({ page }) => {
            await openAndType(page, { "a.md": "base" });
            await page.evaluate(() => {
                window.__basaltTestFs?.seedWorkspace("/work/Other", {
                    "z.md": "zed",
                });
                window.__basaltTestFs?.setPickerResult("/work/Other");
            });
            await failNextWrite(page);

            await page.keyboard.press("Control+o");

            const dialog = page.getByRole("alertdialog");
            await expect(dialog).toBeVisible();
            await expect(
                page.getByRole("textbox", { name: "a", includeHidden: true }),
            ).toContainText("basetyped");
            await page.keyboard.press("Escape");
            await expect(dialog).toHaveCount(0);
            await expect(editor(page, "a")).toContainText("basetyped");
            await expect(option(page, "a")).toBeVisible();
        },
    );

    test(
        "shows the save-failed dialog and keeps the typed text when the window Close button is used with a failing save",
        { tag: "@SAVING-013" },
        async ({ page }) => {
            await openDirtyNoteWithFailingSave(page);

            await page.getByRole("button", { name: "Close window" }).click();

            const dialog = page.getByRole("alertdialog");
            await expect(dialog).toBeVisible();
            await dialog.getByRole("button", { name: "Cancel" }).click();
            await expect(dialog).toHaveCount(0);
            await expect(editor(page, "a")).toContainText("basetyped");
            expect(await readSavedText(page, "a.md")).toBe("base");
        },
    );
});
