import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
    listFiles,
    openWorkspaceWith,
    readSavedText,
} from "./support";

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

function editor(page: Page, name: string) {
    return page.getByRole("textbox", { name });
}

function tab(page: Page, name: string) {
    return page.getByRole("tab", {
        name: new RegExp(`^${name}( not saved)?$`),
    });
}

async function openWorkspaceWithFrozenClock(
    page: Page,
    files: Record<string, string>,
) {
    await installClock(page);
    await openWorkspaceWith(page, "/work/W", files);
    await freezeClock(page);
}

async function startRename(page: Page, name: string) {
    await option(page, name).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await expect(
        page.getByRole("dialog", { name: "Rename note" }),
    ).toBeVisible();
}

test.describe("the note name follows its first heading", () => {
    test(
        "saves the note under its edited heading name and closes the tab when the tab is closed right after the heading was edited",
        { tag: "@NOTES-074" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "Old.md": "# Old\nbody",
            });
            await option(page, "Old").click();
            await page.locator(".cm-line").first().click();
            await page.keyboard.press("End");
            await page.keyboard.type(" title");

            await page
                .getByRole("button", { name: "Close Old", exact: true })
                .click();

            await expect
                .poll(() => readSavedText(page, "Old title.md"))
                .toBe("# Old title\nbody");
            await expect(page.getByRole("tab")).toHaveCount(0);
        },
    );

    test(
        "names the new note after the typed title and keeps focus in the editor when a new note's heading is typed and committed",
        { tag: "@NOTES-075" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "x" });

            await page.keyboard.press("Control+n");
            await expect(editor(page, "Untitled")).toBeFocused();
            await expect(page.locator(".cm-line").nth(0)).toHaveText("# ");
            await page.keyboard.type("Test");
            await expect(tab(page, "Untitled")).toBeVisible();

            await page.keyboard.press("Enter");

            await expect(tab(page, "Test")).toBeVisible();
            await expect(option(page, "Test")).toBeVisible();
            await expect
                .poll(() => listFiles(page))
                .toEqual(["Test.md", "a.md"]);
            await expect(editor(page, "Test")).toBeFocused();
        },
    );

    test(
        "renames the file to the new first heading and keeps the cursor and typing flow when the cursor leaves the heading",
        { tag: "@NOTES-076" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "Untitled.md": "# \nbody",
            });
            await option(page, "Untitled").click();
            await page.locator(".cm-line").nth(0).click();
            await page.keyboard.press("End");
            await page.keyboard.type("Plan");

            await page.keyboard.press("ArrowDown");
            await expect(tab(page, "Plan")).toBeVisible();
            await page.keyboard.type("X");

            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "Plan.md"))
                .toBe("# Plan\nbodyX");
            expect(await listFiles(page)).toEqual(["Plan.md"]);
        },
    );

    test(
        "renames the file when the first heading changes only by case",
        { tag: "@NOTES-077" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "plan.md": "# plan\nx",
            });
            await option(page, "plan").click();
            await page.locator(".cm-line").nth(0).click();
            await page.keyboard.press("Home");
            await page.keyboard.press("ArrowRight");
            await page.keyboard.press("ArrowRight");
            await page.keyboard.press("Delete");
            await page.keyboard.type("P");

            await page.keyboard.press("ArrowDown");

            await expect.poll(() => listFiles(page)).toEqual(["Plan.md"]);
        },
    );

    test(
        "keeps the file name and shows the invalid-name reason when the heading cannot be used as a file name",
        { tag: "@NOTES-078" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "# a\nx" });
            await option(page, "a").click();
            await page.locator(".cm-line").nth(0).click();
            await page.keyboard.press("End");
            await page.keyboard.type(":b");

            await page.keyboard.press("ArrowDown");

            const alert = page
                .getByRole("status")
                .filter({ hasText: "still named a" });
            await expect(alert).toContainText("cannot be used as a note name");
            expect(await listFiles(page)).toEqual(["a.md"]);
            await alert.getByRole("button", { name: "Dismiss" }).click();
            await expect(alert).toHaveCount(0);
        },
    );

    test(
        "keeps the file name and shows the already-exists message when the heading collides with another note",
        { tag: "@NOTES-079" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "a.md": "# a\nx",
                "Taken.md": "t",
            });
            await option(page, "a").click();
            await page.locator(".cm-line").nth(0).click();
            await page.keyboard.press("End");
            await page.keyboard.press("Backspace");
            await page.keyboard.type("taken");

            await page.keyboard.press("ArrowDown");

            await expect(
                page.getByRole("status").filter({ hasText: "already exists" }),
            ).toBeVisible();
            expect(await listFiles(page)).toEqual(["Taken.md", "a.md"]);
        },
    );

    test(
        "keeps the file name when a note without a first heading is edited",
        { tag: "@NOTES-080" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, { "a.md": "plain" });
            await option(page, "a").click();
            await page.getByRole("textbox", { name: "a" }).click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type(" more");
            await page.keyboard.press("Control+Home");

            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("plain more");
            expect(await listFiles(page)).toEqual(["a.md"]);
        },
    );

    test(
        "restores the heading to the file name and changes no file when a cleared heading is left",
        { tag: "@NOTES-081" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "Plan.md": "# Plan\nbody",
            });
            await option(page, "Plan").click();
            await page.locator(".cm-line").nth(0).click();
            await page.keyboard.press("End");
            for (let i = 0; i < 4; i += 1)
                await page.keyboard.press("Backspace");
            await expect(page.locator(".cm-line").nth(0)).toHaveText("# ");

            await page.keyboard.press("ArrowDown");

            await expect(page.locator(".cm-line").nth(0)).toHaveText("Plan");
            expect(await listFiles(page)).toEqual(["Plan.md"]);
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "Plan.md"))
                .toBe("# Plan\nbody");
        },
    );

    test(
        "rewrites links to the renamed note in every note including the renamed note when the heading changes",
        { tag: "@NOTES-082" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "Old.md": "# Old\n[self](Old.md)",
                "other.md": "[to](Old.md)",
                "dir/deep.md": "[to](../Old.md)",
            });
            await option(page, "Old").click();
            await page.locator(".cm-line").nth(0).click();
            await page.keyboard.press("End");
            await page.keyboard.press("Backspace");
            await page.keyboard.press("Backspace");
            await page.keyboard.press("Backspace");
            await page.keyboard.type("New");

            await page.keyboard.press("ArrowDown");

            await expect
                .poll(() => readSavedText(page, "other.md"))
                .toBe("[to](New.md)");
            await expect
                .poll(() => readSavedText(page, "dir/deep.md"))
                .toBe("[to](../New.md)");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "New.md"))
                .toBe("# New\n[self](New.md)");
        },
    );

    test(
        "sets the first heading and updates links without opening the note when a closed note is renamed in the tree",
        { tag: "@NOTES-083" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "Old.md": "# Old\nbody",
                "ref.md": "[o](Old.md)",
            });

            await startRename(page, "Old");
            await page.getByRole("textbox", { name: "Name" }).fill("Fresh");
            await page.keyboard.press("Enter");

            await expect(page.getByRole("dialog")).toHaveCount(0);
            await expect
                .poll(() => listFiles(page))
                .toEqual(["Fresh.md", "ref.md"]);
            expect(await readSavedText(page, "Fresh.md")).toBe("# Fresh\nbody");
            expect(await readSavedText(page, "ref.md")).toBe("[o](Fresh.md)");
            await expect(page.getByRole("tab")).toHaveCount(0);
        },
    );

    test(
        "changes the first heading of the open note when it is renamed in the tree",
        { tag: "@NOTES-084" },
        async ({ page }) => {
            await openWorkspaceWithFrozenClock(page, {
                "Old.md": "# Old\nbody",
            });
            await option(page, "Old").click();

            await startRename(page, "Old");
            await page.getByRole("textbox", { name: "Name" }).fill("Fresh");
            await page.keyboard.press("Enter");

            await expect(tab(page, "Fresh")).toBeVisible();
            await expect(page.locator(".cm-line").nth(0)).toHaveText("# Fresh");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "Fresh.md"))
                .toBe("# Fresh\nbody");
        },
    );
});
