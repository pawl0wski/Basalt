import { expect, test, type Page } from "@playwright/test";
import { listFiles, openWorkspaceWith } from "./support";

const READ_ONLY = "The workspace folder is read-only. Nothing was changed.";

function tree(page: Page) {
    return page.getByRole("tree", { name: "Notes" });
}

function row(page: Page, name: string) {
    return tree(page).getByRole("treeitem", { name, exact: true });
}

function selectedRows(page: Page) {
    return tree(page).locator('[role="treeitem"][aria-selected="true"]');
}

async function ctrlClick(page: Page, name: string) {
    await row(page, name).click({ modifiers: ["Control"] });
}

async function openMenuOn(page: Page, name: string) {
    await row(page, name).click({ button: "right" });
    await page.getByRole("menu").waitFor();
}

async function chooseDelete(page: Page, label = "Delete") {
    await page.getByRole("menuitem", { name: label, exact: true }).click();
    return page.getByRole("alertdialog");
}

const FILES = {
    "Ideas.md": "ideas",
    "Todo.md": "todo",
    "Notes.md": "notes",
    "projects/Roadmap.md": "road",
};

test.describe("deleting one note (AC-04.2)", () => {
    test("asks with the note name, focuses Cancel, and on confirm trashes it and closes its tab", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "Ideas").click();
        await expect(page.getByRole("tab", { name: "Ideas" })).toBeVisible();

        await openMenuOn(page, "Ideas");
        const dialog = await chooseDelete(page);

        await expect(dialog).toHaveAccessibleName('Delete "Ideas"?');
        await expect(
            dialog.getByRole("button", { name: "Cancel" }),
        ).toBeFocused();

        await dialog.getByRole("button", { name: "Delete" }).click();

        await expect(dialog).toHaveCount(0);
        await expect.poll(() => listFiles(page)).not.toContain("Ideas.md");
        await expect(page.getByRole("tab", { name: "Ideas" })).toHaveCount(0);
        await expect(row(page, "Ideas")).toHaveCount(0);
    });

    test("cancelling keeps the note and its tab", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "Ideas").click();
        const before = await listFiles(page);

        await openMenuOn(page, "Ideas");
        const dialog = await chooseDelete(page);
        await dialog.getByRole("button", { name: "Cancel" }).click();

        await expect(dialog).toHaveCount(0);
        expect(await listFiles(page)).toEqual(before);
        await expect(page.getByRole("tab", { name: "Ideas" })).toBeVisible();
    });

    test("a read-only workspace shows the message and deletes nothing", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        const before = await listFiles(page);

        await openMenuOn(page, "Ideas");
        const dialog = await chooseDelete(page);
        await dialog.getByRole("button", { name: "Delete" }).click();

        await expect(page.getByText(READ_ONLY)).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
        await expect(row(page, "Ideas")).toBeVisible();
    });
});

test.describe("deleting several notes at once (AC-04.12)", () => {
    test("asks once for the count and trashes all of them, closing their tabs", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "Ideas").click();
        await row(page, "Todo").click();
        await ctrlClick(page, "Ideas");
        await ctrlClick(page, "Todo");

        await openMenuOn(page, "Ideas");
        const dialog = await chooseDelete(page, "Delete 2 notes");

        await expect(dialog).toHaveAccessibleName("Delete 2 notes?");
        await dialog.getByRole("button", { name: "Delete" }).click();

        await expect(dialog).toHaveCount(0);
        await expect
            .poll(() => listFiles(page))
            .toEqual(["Notes.md", "projects/Roadmap.md"]);
        await expect(page.getByRole("tab", { name: "Ideas" })).toHaveCount(0);
        await expect(page.getByRole("tab", { name: "Todo" })).toHaveCount(0);
        await expect(selectedRows(page)).toHaveCount(0);
    });

    test("a read-only workspace shows the message and keeps the selection", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        const before = await listFiles(page);
        await ctrlClick(page, "Ideas");
        await ctrlClick(page, "Todo");

        await openMenuOn(page, "Ideas");
        const dialog = await chooseDelete(page, "Delete 2 notes");
        await dialog.getByRole("button", { name: "Delete" }).click();

        await expect(page.getByText(READ_ONLY)).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
        await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
    });
});

test.describe("the context menu with a selection (AC-04.11)", () => {
    test("offers only Delete N notes for a note of a multi-selection", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Ideas");
        await ctrlClick(page, "Todo");

        await openMenuOn(page, "Ideas");

        await expect(page.getByRole("menuitem")).toHaveText(["Delete 2 notes"]);
        await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
    });

    test("offers Rename and Delete on a single note and clears a stale selection", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Ideas");
        await ctrlClick(page, "Todo");

        await openMenuOn(page, "Notes");

        await expect(page.getByRole("menuitem")).toHaveText([
            "Rename",
            "Delete",
        ]);
        await expect(selectedRows(page)).toHaveCount(0);
    });
});
