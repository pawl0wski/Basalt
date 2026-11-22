import { expect, test, type Page } from "@playwright/test";
import {
    externalDelete,
    externalWrite,
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

async function openDirty(page: Page, text = "base") {
    await openWorkspaceWith(page, "/work/W", { "a.md": text });
    await option(page, "a").click();
    await editor(page, "a").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" mine");
    await expect(unsavedTab(page)).toBeVisible();
}

async function conflictBanner(page: Page) {
    await openDirty(page);
    await externalWrite(page, "a.md", "theirs");
    const banner = page.getByRole("alert");
    await expect(banner).toContainText("This note changed on disk");
    return banner;
}

async function deletedBanner(page: Page) {
    await openDirty(page);
    await externalDelete(page, "a.md");
    const banner = page.getByRole("alert");
    await expect(banner).toContainText("This note was deleted or moved");
    return banner;
}

test.describe("external changes to the open note", () => {
    test("a clean note reloads silently with the disk text and no banner", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "base" });
        await option(page, "a").click();
        await expect(editor(page, "a")).toContainText("base");

        await externalWrite(page, "a.md", "from disk");

        await expect(editor(page, "a")).toContainText("from disk");
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(savedTab(page)).toBeVisible();
        expect(await readSavedText(page, "a.md")).toBe("from disk");
    });

    test("a dirty note shows the conflict banner within the watcher debounce and keeps the text", async ({
        page,
    }) => {
        const banner = await conflictBanner(page);

        await expect(banner).toContainText("Saving is paused until you choose");
        await expect(editor(page, "a")).toContainText("base mine");
        await page.waitForTimeout(1500);
        expect(await readSavedText(page, "a.md")).toBe("theirs");
    });

    test("Keep my version writes our text and clears the banner", async ({
        page,
    }) => {
        const banner = await conflictBanner(page);

        await banner.getByRole("button", { name: "Keep my version" }).click();

        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(savedTab(page)).toBeVisible();
        expect(await readSavedText(page, "a.md")).toBe("base mine");
    });

    test("Load version from disk asks first; Cancel keeps the text, confirming shows the disk text", async ({
        page,
    }) => {
        const banner = await conflictBanner(page);

        await banner
            .getByRole("button", { name: "Load version from disk" })
            .click();

        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toContainText("Load the version from disk?");
        await expect(dialog).toContainText(
            'Your unsaved changes in "a" will be lost.',
        );
        await expect(
            dialog.getByRole("button", { name: "Cancel" }),
        ).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(editor(page, "a")).toContainText("base mine");

        await banner
            .getByRole("button", { name: "Load version from disk" })
            .click();
        await dialog
            .getByRole("button", { name: "Load version from disk" })
            .click();

        await expect(editor(page, "a")).toContainText("theirs");
        await expect(editor(page, "a")).not.toContainText("mine");
        await expect(page.getByRole("alert")).toHaveCount(0);
        expect(await readSavedText(page, "a.md")).toBe("theirs");
    });

    test("a deleted file shows the banner and is not recreated", async ({
        page,
    }) => {
        const banner = await deletedBanner(page);

        await expect(banner).toContainText("Saving is paused");
        await page.waitForTimeout(1500);
        expect(await readSavedText(page, "a.md")).toBeNull();
        await expect(editor(page, "a")).toContainText("base mine");
    });

    test("Save again here recreates the file with the editor text", async ({
        page,
    }) => {
        const banner = await deletedBanner(page);

        await banner.getByRole("button", { name: "Save again here" }).click();

        await expect(page.getByRole("alert")).toHaveCount(0);
        expect(await readSavedText(page, "a.md")).toBe("base mine");
        await expect(savedTab(page)).toBeVisible();
    });

    test("Close note asks first and closes the tab after confirming", async ({
        page,
    }) => {
        const banner = await deletedBanner(page);

        await banner.getByRole("button", { name: "Close note" }).click();

        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toContainText("Close this note?");
        await expect(dialog).toContainText(
            '"a" was deleted or moved. Your unsaved changes will be lost.',
        );
        await expect(
            dialog.getByRole("button", { name: "Cancel" }),
        ).toBeFocused();
        await dialog.getByRole("button", { name: "Cancel" }).click();
        await expect(editor(page, "a")).toContainText("base mine");

        await banner.getByRole("button", { name: "Close note" }).click();
        await dialog.getByRole("button", { name: "Close note" }).click();

        await expect(page.getByRole("tab")).toHaveCount(0);
        await expect(page.getByText("No note open")).toBeVisible();
    });

    test("the banner is pinned to the top of the editor and as wide as the text column", async ({
        page,
    }) => {
        const long = Array.from({ length: 200 }, (_, i) => `line ${i}`).join(
            "\n",
        );
        await openWorkspaceWith(page, "/work/W", { "a.md": long });
        await option(page, "a").click();
        await editor(page, "a").click();
        await page.keyboard.type("!");
        await externalWrite(page, "a.md", `${long}\nelse`);
        const banner = page.getByRole("alert");
        await expect(banner).toContainText("This note changed on disk");
        const main = page.locator("main");

        const scroller = page.locator(".cm-scroller");
        const yBefore = (await banner.boundingBox())?.y ?? -1;
        await scroller.evaluate((element) => {
            element.scrollTop = 1500;
        });

        const bannerBox = await banner.boundingBox();
        const mainBox = await main.boundingBox();
        const editorBox = await page.locator(".cm-editor").boundingBox();
        expect(bannerBox && mainBox && editorBox).toBeTruthy();
        expect(
            await scroller.evaluate((element) => element.scrollTop),
        ).toBeGreaterThan(0);
        expect(await main.evaluate((element) => element.scrollTop)).toBe(0);
        expect(bannerBox?.y).toBe(yBefore);
        expect(
            Math.abs((bannerBox?.x ?? 0) - (editorBox?.x ?? 0)),
        ).toBeLessThan(2);
        expect(
            Math.abs((bannerBox?.width ?? 0) - (editorBox?.width ?? 0)),
        ).toBeLessThan(2);
    });
});

test.describe("deleted-file banner layout", () => {
    test("is pinned to the top of the editor and as wide as the text column", async ({
        page,
    }) => {
        const long = Array.from({ length: 200 }, (_, i) => `line ${i}`).join(
            "\n",
        );
        await openWorkspaceWith(page, "/work/W", { "a.md": long });
        await option(page, "a").click();
        await editor(page, "a").click();
        await page.keyboard.type("!");
        await externalDelete(page, "a.md");
        const banner = page.getByRole("alert");
        await expect(banner).toContainText("This note was deleted or moved");
        const main = page.locator("main");

        const scroller = page.locator(".cm-scroller");
        const yBefore = (await banner.boundingBox())?.y ?? -1;
        await scroller.evaluate((element) => {
            element.scrollTop = 1500;
        });

        const bannerBox = await banner.boundingBox();
        const mainBox = await main.boundingBox();
        const editorBox = await page.locator(".cm-editor").boundingBox();
        expect(bannerBox && mainBox && editorBox).toBeTruthy();
        expect(
            await scroller.evaluate((element) => element.scrollTop),
        ).toBeGreaterThan(0);
        expect(await main.evaluate((element) => element.scrollTop)).toBe(0);
        expect(bannerBox?.y).toBe(yBefore);
        expect(
            Math.abs((bannerBox?.width ?? 0) - (editorBox?.width ?? 0)),
        ).toBeLessThan(2);
    });

    test("Escape on the Close note confirmation cancels and keeps the text", async ({
        page,
    }) => {
        const banner = await deletedBanner(page);

        await banner.getByRole("button", { name: "Close note" }).click();
        await expect(page.getByRole("alertdialog")).toBeVisible();
        await page.keyboard.press("Escape");

        await expect(page.getByRole("alertdialog")).toHaveCount(0);
        await expect(page.getByRole("tab")).toHaveCount(1);
        await expect(editor(page, "a")).toContainText("base mine");
    });
});

test.describe("workspace folder lost", () => {
    test("with no unsaved text it returns to Welcome with the notice", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "base" });
        await option(page, "a").click();
        await expect(editor(page, "a")).toContainText("base");

        await removeRoot(page);

        await expect(page.getByText("Workspace unavailable")).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Open folder as workspace" }),
        ).toBeVisible();
        const stored = await page.evaluate(() =>
            window.localStorage.getItem("basalt.memory.settings"),
        );
        expect(stored).toContain("/work/W");
    });

    test("with unsaved text the editor stays, the dialog runs first, then the banner offers Retry and Change workspace", async ({
        page,
    }) => {
        await openDirty(page);

        await removeRoot(page);

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

        await banner.getByRole("button", { name: "Retry" }).click();
        await expect(page.getByRole("alertdialog")).toContainText(
            "The workspace folder is not available",
        );
    });
});
