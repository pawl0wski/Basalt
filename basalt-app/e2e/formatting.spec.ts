import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
    openWorkspaceWith,
    readSavedText,
} from "./support";

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

async function openNote(page: Page, content: string) {
    await installClock(page);
    await openWorkspaceWith(page, "/work/W", { "a.md": content });
    await option(page, "a").click();
    await expect(page.locator(".cm-editor")).toHaveCount(1);
    await freezeClock(page);
    await page.getByRole("textbox", { name: "a" }).focus();
}

test.describe("bold and italic shortcuts", () => {
    test(
        "wraps the selection in bold markers, renders bold off the line, saves the markers and unwraps with a second press when Ctrl+B is pressed",
        { tag: "@FORMATTING-001" },
        async ({ page }) => {
            await openNote(page, "word\nnext");
            await page.keyboard.press("Control+Home");
            await page.keyboard.press("Shift+End");

            await page.keyboard.press("Control+b");
            await expect(page.locator(".cm-line").nth(0)).toHaveText(
                "**word**",
            );

            await page.locator(".cm-line").nth(1).click();
            await expect(page.locator(".cm-lp-strong")).toHaveText("word");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("**word**\nnext");

            await page.locator(".cm-line").nth(0).click();
            await page.keyboard.press("Control+Home");
            await page.keyboard.press("Shift+End");
            await page.keyboard.press("Control+b");
            await expect(page.locator(".cm-line").nth(0)).toHaveText("word");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("word\nnext");
        },
    );

    test(
        "inserts an empty italic pair with the cursor between and removes it with a second press when Ctrl+I is pressed without a selection",
        { tag: "@FORMATTING-002" },
        async ({ page }) => {
            await openNote(page, "");

            await page.keyboard.press("Control+i");
            await expect(page.locator(".cm-line").nth(0)).toHaveText("**");

            await page.keyboard.type("x");
            await expect(page.locator(".cm-line").nth(0)).toHaveText("*x*");
            await page.keyboard.press("Backspace");
            await page.keyboard.press("Control+i");
            await expect(page.locator(".cm-line").nth(0)).toHaveText("");
        },
    );

    test(
        "leaves the text and the undo history untouched when Ctrl+B and Ctrl+I are pressed with a whitespace-only selection",
        { tag: "@FORMATTING-003" },
        async ({ page }) => {
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
        },
    );

    test(
        "unwraps a selection that includes its markers and restores it in one Undo step when Ctrl+B is pressed",
        { tag: "@FORMATTING-004" },
        async ({ page }) => {
            await openNote(page, "**word**");
            await page.keyboard.press("Control+a");

            await page.keyboard.press("Control+b");
            await expect(page.locator(".cm-line").nth(0)).toHaveText("word");

            await page.keyboard.press("Control+z");
            await expect(page.locator(".cm-line").nth(0)).toHaveText(
                "**word**",
            );
        },
    );

    test(
        "changes nothing when Ctrl+B and Ctrl+I are pressed while the notes tree has focus",
        { tag: "@FORMATTING-005" },
        async ({ page }) => {
            await openNote(page, "word");
            await option(page, "a").focus();

            await page.keyboard.press("Control+b");
            await page.keyboard.press("Control+i");

            await expect(page.locator(".cm-line").nth(0)).toHaveText("word");
        },
    );
});
