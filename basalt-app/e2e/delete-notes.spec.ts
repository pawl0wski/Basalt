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
    return tree(page).getByRole("treeitem", { selected: true });
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
    test(
        "asks with the note name and Cancel focused and removes the note and its tab when Delete is confirmed",
        { tag: "@NOTES-069" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").click();
            await expect(
                page.getByRole("tab", { name: "Ideas" }),
            ).toBeVisible();

            await openMenuOn(page, "Ideas");
            const dialog = await chooseDelete(page);

            await expect(dialog).toHaveAccessibleName('Delete "Ideas"?');
            await expect(
                dialog.getByRole("button", { name: "Cancel" }),
            ).toBeFocused();

            await dialog.getByRole("button", { name: "Delete" }).click();

            await expect(dialog).toHaveCount(0);
            await expect.poll(() => listFiles(page)).not.toContain("Ideas.md");
            await expect(page.getByRole("tab", { name: "Ideas" })).toHaveCount(
                0,
            );
            await expect(row(page, "Ideas")).toHaveCount(0);
        },
    );

    test(
        "keeps the note, its file and its tab when Cancel is chosen in the delete confirmation",
        { tag: "@NOTES-070" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").click();
            const before = await listFiles(page);

            await openMenuOn(page, "Ideas");
            const dialog = await chooseDelete(page);
            await dialog.getByRole("button", { name: "Cancel" }).click();

            await expect(dialog).toHaveCount(0);
            expect(await listFiles(page)).toEqual(before);
            await expect(
                page.getByRole("tab", { name: "Ideas" }),
            ).toBeVisible();
        },
    );

    test(
        "shows the read-only message and deletes nothing when a note is deleted in a read-only workspace",
        { tag: "@NOTES-071" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
            const before = await listFiles(page);

            await openMenuOn(page, "Ideas");
            const dialog = await chooseDelete(page);
            await dialog.getByRole("button", { name: "Delete" }).click();

            await expect(page.getByText(READ_ONLY)).toBeVisible();
            expect(await listFiles(page)).toEqual(before);
            await expect(row(page, "Ideas")).toBeVisible();
        },
    );
});

test.describe("deleting several notes at once (AC-04.12)", () => {
    test(
        "asks once with the count and removes all selected notes and their tabs when Delete 2 notes is confirmed",
        { tag: "@NOTES-072" },
        async ({ page }) => {
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
            await expect(page.getByRole("tab", { name: "Ideas" })).toHaveCount(
                0,
            );
            await expect(page.getByRole("tab", { name: "Todo" })).toHaveCount(
                0,
            );
            await expect(selectedRows(page)).toHaveCount(0);
        },
    );

    test(
        "shows the read-only message and keeps the selection when selected notes are deleted in a read-only workspace",
        { tag: "@NOTES-073" },
        async ({ page }) => {
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
        },
    );
});
