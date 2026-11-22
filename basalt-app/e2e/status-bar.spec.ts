import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
    openWorkspaceWith,
    readSavedText,
    setReadOnly,
} from "./support";

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
    test(
        "shows an empty status bar until a note is open and then its word count",
        { tag: "@STATUSBAR-002" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "one two" });

            await expect(bar(page)).toBeVisible();
            await expect(bar(page)).toHaveText("");

            await option(page, "a").click();
            await expect(bar(page)).toHaveText("2 words");
        },
    );

    test(
        "updates the word count with every typed change in the open note",
        { tag: "@STATUSBAR-003" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "" });
            await option(page, "a").click();
            await expect(bar(page)).toHaveText("0 words");

            await editor(page, "a").click();
            await page.keyboard.type("hello");
            await expect(bar(page)).toHaveText("1 word");

            await page.keyboard.type(" brave new world");
            await expect(bar(page)).toHaveText("4 words");
        },
    );

    test(
        "counts zero words for bare Markdown markers and one word once a word is typed",
        { tag: "@STATUSBAR-004" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "# \n\n- \n\n---\n",
            });
            await option(page, "a").click();
            await expect(bar(page)).toHaveText("0 words");

            await editor(page, "a").click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type("item");
            await expect(bar(page)).toHaveText("1 word");
        },
    );

    test(
        "shows the word count with a thousands separator for a long note",
        { tag: "@STATUSBAR-005" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "word ".repeat(1204),
            });
            await option(page, "a").click();

            await expect(bar(page)).toHaveText("1,204 words");
        },
    );

    test(
        "shows the word count of the active tab when the tab is switched",
        { tag: "@STATUSBAR-006" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "one",
                "b.md": "one two three",
            });
            await option(page, "a").click();
            await option(page, "b").click();
            await expect(bar(page)).toHaveText("3 words");

            await page.getByRole("tab", { name: "a", exact: true }).click();
            await expect(bar(page)).toHaveText("1 word");
        },
    );

    test(
        "keeps the word count and shows no save wording while saving fails and after Retry succeeds",
        { tag: "@STATUSBAR-007" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(
                page,
                "/work/W",
                { "a.md": "base" },
                { readOnly: true },
            );
            await option(page, "a").click();
            await freezeClock(page);
            await editor(page, "a").click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type(" more");
            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect(page.getByRole("alert")).toContainText(
                "Could not save the note",
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
        },
    );

    test(
        "renders the word count outside any live region",
        { tag: "@STATUSBAR-008" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "one" });
            await option(page, "a").click();

            const count = bar(page).getByText("1 word", { exact: true });
            await expect(count).toBeVisible();
            expect(
                await count.evaluate(
                    (element) =>
                        element.closest(
                            "[aria-live], [role='status'], [role='alert'], [role='log']",
                        ) === null,
                ),
            ).toBe(true);
        },
    );
});
