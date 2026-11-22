import { expect, test, type Page } from "@playwright/test";
import { openWorkspaceWith, readSavedText, setReadOnly } from "./support";

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

function editor(page: Page, name: string) {
    return page.getByRole("textbox", { name });
}

function bar(page: Page) {
    return page.locator(".bs-status-bar");
}

test.describe("status bar word count", () => {
    test("shows nothing until a note is open", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "one two" });

        await expect(bar(page)).toBeVisible();
        await expect(bar(page)).toHaveText("");

        await option(page, "a").click();
        await expect(bar(page)).toHaveText("2 words");
    });

    test("follows the text as the owner types", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await option(page, "a").click();
        await expect(bar(page)).toHaveText("0 words");

        await editor(page, "a").click();
        await page.keyboard.type("hello");
        await expect(bar(page)).toHaveText("1 word");

        await page.keyboard.type(" brave new world");
        await expect(bar(page)).toHaveText("4 words");
    });

    test("does not count Markdown markers as words", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "# \n\n- \n\n---\n",
        });
        await option(page, "a").click();
        await expect(bar(page)).toHaveText("0 words");

        await editor(page, "a").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("item");
        await expect(bar(page)).toHaveText("1 word");
    });

    test("separates thousands", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "word ".repeat(1204),
        });
        await option(page, "a").click();

        await expect(bar(page)).toHaveText("1,204 words");
    });

    test("follows the active tab", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "one",
            "b.md": "one two three",
        });
        await option(page, "a").click();
        await option(page, "b").click();
        await expect(bar(page)).toHaveText("3 words");

        await page.getByRole("tab", { name: "a", exact: true }).click();
        await expect(bar(page)).toHaveText("1 word");
    });

    test("keeps the count and shows no save wording while autosave is paused", async ({
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
        await page.keyboard.type(" more");

        await expect(page.getByRole("alert")).toContainText(
            "Could not save the note",
            { timeout: 5000 },
        );
        await expect(
            page.getByRole("tab", { name: "a not saved", exact: true }),
        ).toBeVisible();
        await expect(bar(page)).toHaveText("2 words");
        await expect(bar(page)).not.toContainText(/saved|saving/i);

        await setReadOnly(page, false);
        await page.getByRole("button", { name: "Retry" }).click();
        await expect(
            page.getByRole("tab", { name: "a", exact: true }),
        ).toBeVisible();
        expect(await readSavedText(page, "a.md")).toBe("base more");
        await expect(bar(page)).toHaveText("2 words");
    });

    test("the count is plain text, not a live region", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "one" });
        await option(page, "a").click();

        await expect(
            page.locator(
                ".bs-status-bar [aria-live], .bs-status-bar [role=status]",
            ),
        ).toHaveCount(0);
    });
});
