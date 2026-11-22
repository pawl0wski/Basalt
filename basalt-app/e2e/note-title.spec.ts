import { expect, test, type Page } from "@playwright/test";
import { listFiles, openWorkspaceWith, readSavedText } from "./support";

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

async function startRename(page: Page, name: string) {
    await option(page, name).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await expect(
        page.getByRole("dialog", { name: "Rename note" }),
    ).toBeVisible();
}

test.describe("the note name follows its first heading", () => {
    test("closing a tab from its edited heading saves the renamed note and closes the tab", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "Old.md": "# Old\nbody" });
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
    });

    test("a new note opens with an empty heading and is named after the typed title (AC-06.1)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "x" });

        await page.keyboard.press("Control+n");
        await expect(editor(page, "Untitled")).toBeFocused();
        await expect(page.locator(".cm-line").nth(0)).toHaveText("# ");
        await page.keyboard.type("Test");
        await expect(tab(page, "Untitled")).toBeVisible();

        await page.keyboard.press("Enter");

        await expect(tab(page, "Test")).toBeVisible();
        await expect(option(page, "Test")).toBeVisible();
        await expect.poll(() => listFiles(page)).toEqual(["Test.md", "a.md"]);
        await expect(editor(page, "Test")).toBeFocused();
    });

    test("the heading commit renames the file and keeps the cursor and typing flow (AC-06.2, AC-06.9)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "Untitled.md": "# \nbody",
        });
        await option(page, "Untitled").click();
        await page.locator(".cm-line").nth(0).click();
        await page.keyboard.press("End");
        await page.keyboard.type("Plan");

        await page.keyboard.press("ArrowDown");
        await expect(tab(page, "Plan")).toBeVisible();
        await page.keyboard.type("X");

        await expect
            .poll(() => readSavedText(page, "Plan.md"), { timeout: 5000 })
            .toBe("# Plan\nbodyX");
        expect(await listFiles(page)).toEqual(["Plan.md"]);
    });

    test("a case-only change renames the file (AC-06.7)", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "plan.md": "# plan\nx" });
        await option(page, "plan").click();
        await page.locator(".cm-line").nth(0).click();
        await page.keyboard.press("Home");
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("Delete");
        await page.keyboard.type("P");

        await page.keyboard.press("ArrowDown");

        await expect.poll(() => listFiles(page)).toEqual(["Plan.md"]);
    });

    test("an invalid heading keeps the file and shows the reason (AC-06.4)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "# a\nx" });
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
    });

    test("a colliding heading keeps the file and shows the collision (AC-06.4)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
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
    });

    test("a note without a heading keeps its name (AC-06.5)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "plain" });
        await option(page, "a").click();
        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type(" more");
        await page.keyboard.press("Control+Home");

        await expect
            .poll(() => readSavedText(page, "a.md"), { timeout: 5000 })
            .toBe("plain more");
        expect(await listFiles(page)).toEqual(["a.md"]);
    });

    test("a cleared heading is restored to the file name (AC-06.6)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "Plan.md": "# Plan\nbody" });
        await option(page, "Plan").click();
        await page.locator(".cm-line").nth(0).click();
        await page.keyboard.press("End");
        for (let i = 0; i < 4; i += 1) await page.keyboard.press("Backspace");
        await expect(page.locator(".cm-line").nth(0)).toHaveText("# ");

        await page.keyboard.press("ArrowDown");

        await expect(page.locator(".cm-line").nth(0)).toHaveText("Plan");
        expect(await listFiles(page)).toEqual(["Plan.md"]);
        await expect
            .poll(() => readSavedText(page, "Plan.md"), { timeout: 5000 })
            .toBe("# Plan\nbody");
    });

    test("links to the renamed note are rewritten in every note (AC-06.8)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
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
        await expect
            .poll(() => readSavedText(page, "New.md"), { timeout: 5000 })
            .toBe("# New\n[self](New.md)");
    });

    test("renaming a closed note in the tree sets its heading and does not open it (AC-06.3)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
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
    });

    test("renaming an open note in the tree changes its first heading (AC-06.3)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "Old.md": "# Old\nbody" });
        await option(page, "Old").click();

        await startRename(page, "Old");
        await page.getByRole("textbox", { name: "Name" }).fill("Fresh");
        await page.keyboard.press("Enter");

        await expect(tab(page, "Fresh")).toBeVisible();
        await expect(page.locator(".cm-line").nth(0)).toHaveText("# Fresh");
        await expect
            .poll(() => readSavedText(page, "Fresh.md"), { timeout: 5000 })
            .toBe("# Fresh\nbody");
    });
});
