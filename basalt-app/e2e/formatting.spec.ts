import { expect, test, type Page } from "@playwright/test";
import { openWorkspaceWith, readSavedText } from "./support";

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

async function openNote(page: Page, content: string) {
    await openWorkspaceWith(page, "/work/W", { "a.md": content });
    await option(page, "a").click();
    await expect(page.locator(".cm-editor")).toHaveCount(1);
    await page.getByRole("textbox", { name: "a" }).focus();
}

test.describe("bold and italic shortcuts", () => {
    test("Ctrl+B wraps the selection, renders bold off the line and a second press unwraps", async ({
        page,
    }) => {
        await openNote(page, "word\nnext");
        await page.keyboard.press("Control+Home");
        await page.keyboard.press("Shift+End");

        await page.keyboard.press("Control+b");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("**word**");

        await page.locator(".cm-line").nth(1).click();
        await expect(page.locator(".cm-lp-strong")).toHaveText("word");
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("**word**\nnext");

        await page.locator(".cm-line").nth(0).click();
        await page.keyboard.press("Control+Home");
        await page.keyboard.press("Shift+End");
        await page.keyboard.press("Control+b");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("word");
        await expect.poll(() => readSavedText(page, "a.md")).toBe("word\nnext");
    });

    test("Ctrl+I inserts the empty pair with the cursor between and a second press removes it", async ({
        page,
    }) => {
        await openNote(page, "");

        await page.keyboard.press("Control+i");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("**");

        await page.keyboard.type("x");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("*x*");
        await page.keyboard.press("Backspace");
        await page.keyboard.press("Control+i");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("");
    });

    test("a whitespace-only selection is left untouched", async ({ page }) => {
        await openNote(page, "a   b");
        await page.keyboard.press("Control+Home");
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("Shift+ArrowRight");
        await page.keyboard.press("Shift+ArrowRight");

        await page.keyboard.press("Control+b");
        await page.keyboard.press("Control+i");

        await expect(page.locator(".cm-line").nth(0)).toHaveText("a   b");
        await page.keyboard.press("Control+z");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("a   b");
    });

    test("a selection that includes its markers unwraps and Undo restores in one step", async ({
        page,
    }) => {
        await openNote(page, "**word**");
        await page.keyboard.press("Control+a");

        await page.keyboard.press("Control+b");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("word");

        await page.keyboard.press("Control+z");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("**word**");
    });

    test("does nothing while focus is in the notes tree", async ({ page }) => {
        await openNote(page, "word");
        await option(page, "a").focus();

        await page.keyboard.press("Control+b");
        await page.keyboard.press("Control+i");

        await expect(page.locator(".cm-line").nth(0)).toHaveText("word");
    });
});
