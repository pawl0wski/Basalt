import { expect, test, type Page } from "@playwright/test";
import {
    failNextWrite,
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

async function openAndType(page: Page, files: Record<string, string>) {
    await openWorkspaceWith(page, "/work/W", files);
    await option(page, "a").click();
    await editor(page, "a").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("typed");
}

test.describe("save state", () => {
    test("the tab goes from saved to not saved while typing and back, with the exact bytes on disk", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();
        await expect(savedTab(page)).toBeVisible();

        await editor(page, "a").click();
        await page.keyboard.type("hello world");

        await expect(unsavedTab(page)).toBeVisible();
        await expect(savedTab(page)).toBeVisible({ timeout: 5000 });
        expect(await readSavedBytes(page, "a.md")).toEqual(
            Array.from(new TextEncoder().encode("hello world")),
        );
    });

    test("the status bar never shows save wording or a sync word while saving", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "x" });
        await option(page, "a").click();
        await editor(page, "a").click();
        await page.keyboard.type(" y");

        const bar = page.locator(".bs-status-bar");
        for (let i = 0; i < 40; i += 1) {
            await expect(bar).not.toContainText(/saved|saving|sync/i);
            await page.waitForTimeout(100);
        }
        await expect(bar).toHaveText("2 words");
    });

    test("Ctrl+S saves immediately without the browser dialog", async ({
        page,
    }) => {
        await openAndType(page, { "a.md": "" });
        await expect(unsavedTab(page)).toBeVisible();

        await page.keyboard.press("Control+s");

        await expect(savedTab(page)).toBeVisible({ timeout: 800 });
        expect(await readSavedText(page, "a.md")).toBe("typed");
    });
});

test.describe("save errors", () => {
    test("a read-only workspace shows the alert, keeps the text, and Retry works after the cause is fixed", async ({
        page,
    }) => {
        await openWorkspaceWith(
            page,
            "/work/W",
            { "a.md": "base" },
            { readOnly: true },
        );
        await option(page, "a").click();
        await editor(page, "a").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("!");

        const alert = page.getByRole("alert");
        await expect(alert).toContainText("Could not save the note", {
            timeout: 5000,
        });
        await expect(alert).toContainText(READ_ONLY);
        await expect(unsavedTab(page)).toBeVisible();
        await expect(editor(page, "a")).toContainText("base!");

        await alert.getByRole("button", { name: "Retry" }).click();
        await expect(alert).toBeVisible();
        await expect(editor(page, "a")).toContainText("base!");

        await setReadOnly(page, false);
        await alert.getByRole("button", { name: "Retry" }).click();

        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(savedTab(page)).toBeVisible();
        expect(await readSavedText(page, "a.md")).toBe("base!");
    });

    test("the banner is pinned to the top of the editor while the note scrolls", async ({
        page,
    }) => {
        const long = Array.from({ length: 200 }, (_, i) => `line ${i}`).join(
            "\n",
        );
        await openWorkspaceWith(
            page,
            "/work/W",
            { "a.md": long },
            { readOnly: true },
        );
        await option(page, "a").click();
        await editor(page, "a").click();
        await page.keyboard.type("!");
        const alert = page.getByRole("alert");
        await expect(alert).toBeVisible({ timeout: 5000 });
        const main = page.locator("main");

        const scroller = page.locator(".cm-scroller");
        const yBefore = (await alert.boundingBox())?.y ?? -1;
        await scroller.evaluate((element) => {
            element.scrollTop = 1500;
        });

        const alertBox = await alert.boundingBox();
        const mainBox = await main.boundingBox();
        const editorBox = await page.locator(".cm-editor").boundingBox();
        expect(alertBox && mainBox && editorBox).toBeTruthy();
        expect(
            await scroller.evaluate((element) => element.scrollTop),
        ).toBeGreaterThan(0);
        expect(await main.evaluate((element) => element.scrollTop)).toBe(0);
        expect(alertBox?.y).toBe(yBefore);
        expect(Math.abs((alertBox?.x ?? 0) - (editorBox?.x ?? 0))).toBeLessThan(
            2,
        );
        expect(
            Math.abs((alertBox?.width ?? 0) - (editorBox?.width ?? 0)),
        ).toBeLessThan(2);
    });
});

test.describe("leaving a note", () => {
    async function dirtyWithFailingSave(page: Page) {
        await openAndType(page, { "a.md": "base" });
        await failNextWrite(page);
        await page.getByRole("button", { name: "Close a" }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        return dialog;
    }

    test("closing a dirty tab with a failing save opens the dialog with focus on Cancel", async ({
        page,
    }) => {
        const dialog = await dirtyWithFailingSave(page);

        await expect(dialog).toContainText('Could not save "a"');
        await expect(dialog).toContainText("Something went wrong.");
        await expect(
            dialog.getByRole("button", { name: "Cancel" }),
        ).toBeFocused();
    });

    test("Escape cancels: the tab and the text are still there", async ({
        page,
    }) => {
        await dirtyWithFailingSave(page);

        await page.keyboard.press("Escape");

        await expect(page.getByRole("alertdialog")).toHaveCount(0);
        await expect(page.getByRole("tab", { name: /^a/ })).toBeVisible();
        await expect(editor(page, "a")).toContainText("basetyped");
    });

    test("Discard changes closes the tab and drops the text", async ({
        page,
    }) => {
        const dialog = await dirtyWithFailingSave(page);

        await dialog.getByRole("button", { name: "Discard changes" }).click();

        await expect(page.getByRole("tab")).toHaveCount(0);
        await expect(page.getByText("No note open")).toBeVisible();
        expect(await readSavedText(page, "a.md")).toBe("base");
    });

    test("Retry saves and closes the tab once the cause is fixed", async ({
        page,
    }) => {
        const dialog = await dirtyWithFailingSave(page);

        await dialog.getByRole("button", { name: "Retry" }).click();

        await expect(page.getByRole("tab")).toHaveCount(0);
        expect(await readSavedText(page, "a.md")).toBe("basetyped");
    });

    test("closing a clean tab never opens the dialog", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "base" });
        await option(page, "a").click();

        await page.getByRole("button", { name: "Close a" }).click();

        await expect(page.getByRole("tab")).toHaveCount(0);
        await expect(page.getByRole("alertdialog")).toHaveCount(0);
    });

    test("changing workspace with a failing flush shows the dialog and keeps the workspace", async ({
        page,
    }) => {
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
    });

    test("the window Close button flushes first and asks when saving fails", async ({
        page,
    }) => {
        await openAndType(page, { "a.md": "base" });
        await failNextWrite(page);

        await page.getByRole("button", { name: "Close window" }).click();

        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole("button", { name: "Cancel" }).click();
        await expect(editor(page, "a")).toContainText("basetyped");
    });
});
