import { expect, test, type JSHandle, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
    listFiles,
    openWorkspaceWith,
    readSavedText,
} from "./support";

const HOVER_OPEN_DELAY_MS = 600;
const READ_ONLY = "The workspace folder is read-only. Nothing was changed.";

function notifications(page: Page) {
    return page.getByRole("region", { name: /Notifications/ });
}

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

async function dragStart(page: Page, name: string): Promise<JSHandle> {
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await row(page, name).dispatchEvent("dragstart", { dataTransfer });
    return dataTransfer;
}

async function dragOverRow(page: Page, name: string, dataTransfer: JSHandle) {
    await row(page, name).dispatchEvent("dragover", { dataTransfer });
}

async function dragOverRoot(page: Page, dataTransfer: JSHandle) {
    await tree(page).dispatchEvent("dragover", { dataTransfer });
}

async function dropOnRow(page: Page, name: string, dataTransfer: JSHandle) {
    await row(page, name).dispatchEvent("drop", { dataTransfer });
}

async function dropOnRoot(page: Page, dataTransfer: JSHandle) {
    await tree(page).dispatchEvent("drop", { dataTransfer });
}

async function dragNoteOnto(page: Page, note: string, folder: string) {
    const dataTransfer = await dragStart(page, note);
    await dragOverRow(page, folder, dataTransfer);
    await dropOnRow(page, folder, dataTransfer);
    await row(page, note).dispatchEvent("dragend", { dataTransfer });
}

const FILES = {
    "Ideas.md": "ideas",
    "Todo.md": "todo",
    "Notes.md": "notes",
    "projects/Roadmap.md": "road",
    "projects/2026/Plan.md": "plan",
};

test.describe("moving a note by dragging (AC-04.5)", () => {
    test(
        "moves the file and opens the destination folder when a note is dropped on a folder row",
        { tag: "@NOTES-004" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await dragNoteOnto(page, "Ideas", "projects");

            expect(await listFiles(page)).toEqual([
                "Notes.md",
                "Todo.md",
                "projects/2026/Plan.md",
                "projects/Ideas.md",
                "projects/Roadmap.md",
            ]);
            await expect(row(page, "projects")).toHaveAttribute(
                "aria-expanded",
                "true",
            );
            await expect(row(page, "Ideas")).toHaveAttribute("aria-level", "2");
            expect(await readSavedText(page, "projects/Ideas.md")).toBe(
                "ideas",
            );
        },
    );

    test(
        "moves the note when a real mouse drag ends on a folder row",
        { tag: "@NOTES-005" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await row(page, "Ideas").dragTo(row(page, "projects"));

            await expect
                .poll(() => listFiles(page))
                .toContain("projects/Ideas.md");
            expect(await listFiles(page)).not.toContain("Ideas.md");
        },
    );

    test(
        "moves the open tab with the note, keeps its text and saves later edits to the new path",
        { tag: "@NOTES-006" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").click();
            await expect(
                page.getByRole("textbox", { name: "Ideas" }),
            ).toContainText("ideas");
            await freezeClock(page);

            await dragNoteOnto(page, "Ideas", "projects");

            await expect(page.getByRole("tab")).toHaveText(["Ideas"]);
            await expect(
                page.getByRole("tab", { name: "Ideas" }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(
                page.getByRole("textbox", { name: "Ideas" }),
            ).toContainText("ideas");
            await expect(row(page, "Ideas")).toHaveAttribute(
                "aria-current",
                "true",
            );
            await page.getByRole("textbox", { name: "Ideas" }).click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type("!");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "projects/Ideas.md"))
                .toBe("ideas!");
            expect(await listFiles(page)).not.toContain("Ideas.md");
        },
    );

    test(
        "saves the unsaved text before the move when a dirty note is dragged to a folder",
        { tag: "@NOTES-007" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").click();
            await freezeClock(page);
            await page.getByRole("textbox", { name: "Ideas" }).click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type(" more");

            await dragNoteOnto(page, "Ideas", "projects");

            await expect
                .poll(() => readSavedText(page, "projects/Ideas.md"))
                .toBe("ideas more");
        },
    );

    test(
        "moves a nested note to the workspace root when it is dropped on the empty sidebar area",
        { tag: "@NOTES-008" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();
            await row(page, "Roadmap").click();

            const dataTransfer = await dragStart(page, "Roadmap");
            await dragOverRoot(page, dataTransfer);
            await expect(tree(page)).toHaveCSS("outline-style", /solid|auto/);
            await dropOnRoot(page, dataTransfer);

            expect(await listFiles(page)).toContain("Roadmap.md");
            expect(await listFiles(page)).not.toContain("projects/Roadmap.md");
            await expect(
                page.getByRole("tab", { name: "Roadmap" }),
            ).toBeVisible();
            await expect(row(page, "Roadmap")).toHaveAttribute(
                "aria-level",
                "1",
            );
        },
    );

    test(
        "highlights a folder only while it is the drop target of a drag",
        { tag: "@NOTES-009" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const dataTransfer = await dragStart(page, "Ideas");

            await expect(row(page, "projects")).not.toHaveAttribute(
                "data-drop-target",
                "true",
            );
            await dragOverRow(page, "projects", dataTransfer);
            await expect(row(page, "projects")).toHaveAttribute(
                "data-drop-target",
                "true",
            );
            await dragOverRow(page, "Todo", dataTransfer);
            await expect(row(page, "projects")).not.toHaveAttribute(
                "data-drop-target",
            );
        },
    );

    test(
        "opens a collapsed folder after the hover delay while a note is dragged over it",
        { tag: "@NOTES-010" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", FILES);
            await freezeClock(page);
            const dataTransfer = await dragStart(page, "Ideas");

            await dragOverRow(page, "projects", dataTransfer);

            await expect(row(page, "projects")).toHaveAttribute(
                "aria-expanded",
                "false",
            );
            await advanceClock(page, HOVER_OPEN_DELAY_MS);
            await expect(row(page, "projects")).toHaveAttribute(
                "aria-expanded",
                "true",
            );
            await expect(row(page, "Roadmap")).toBeVisible();
        },
    );

    test(
        "keeps a collapsed folder closed when the drag leaves it before the hover delay passes",
        { tag: "@NOTES-011" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", FILES);
            await freezeClock(page);
            const dataTransfer = await dragStart(page, "Ideas");

            await dragOverRow(page, "projects", dataTransfer);
            await dragOverRow(page, "Todo", dataTransfer);
            await advanceClock(page, HOVER_OPEN_DELAY_MS * 1.5);

            await expect(row(page, "projects")).toHaveAttribute(
                "aria-expanded",
                "false",
            );
        },
    );

    test(
        "ignores a drop on the note's own folder with no highlight, no file change and no error",
        { tag: "@NOTES-012" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();
            const before = await listFiles(page);

            const dataTransfer = await dragStart(page, "Roadmap");
            await dragOverRow(page, "projects", dataTransfer);
            await expect(row(page, "projects")).not.toHaveAttribute(
                "data-drop-target",
                "true",
            );
            await dropOnRow(page, "projects", dataTransfer);

            expect(await listFiles(page)).toEqual(before);
            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(
                page
                    .getByRole("navigation", { name: "Workspace" })
                    .getByRole("status"),
            ).toHaveCount(0);
            await expect(row(page, "Roadmap")).toHaveAttribute(
                "aria-level",
                "2",
            );
        },
    );

    test(
        "ignores a drop of a root note on the root area with no file change and no error",
        { tag: "@NOTES-013" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const before = await listFiles(page);

            const dataTransfer = await dragStart(page, "Ideas");
            await dragOverRoot(page, dataTransfer);
            await dropOnRoot(page, dataTransfer);

            expect(await listFiles(page)).toEqual(before);
            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(
                page
                    .getByRole("navigation", { name: "Workspace" })
                    .getByRole("status"),
            ).toHaveCount(0);
        },
    );

    test(
        "changes nothing and clears the highlight when a drag ends outside any drop target",
        { tag: "@NOTES-014" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const before = await listFiles(page);

            const dataTransfer = await dragStart(page, "Ideas");
            await dragOverRow(page, "projects", dataTransfer);
            await row(page, "Ideas").dispatchEvent("dragend", { dataTransfer });

            expect(await listFiles(page)).toEqual(before);
            await expect(row(page, "projects")).not.toHaveAttribute(
                "data-drop-target",
                "true",
            );
            await expect(row(page, "Ideas")).not.toHaveAttribute(
                "data-dragging",
            );
            await dragOverRow(page, "projects", dataTransfer);
            await expect(row(page, "projects")).not.toHaveAttribute(
                "data-drop-target",
                "true",
            );
        },
    );

    test(
        "rewrites relative image and note links and keeps other text when a note is moved to a folder",
        { tag: "@NOTES-015" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "Gallery.md":
                    "# Pics\n\n![one](attachments/one.png)\n\n[site](https://example.com/a.png)\n\n[self](Other.md)",
                "attachments/one.png": new Uint8Array([1, 2, 3]),
                "Other.md": "",
                "projects/Roadmap.md": "",
            });

            await dragNoteOnto(page, "Gallery", "projects");

            await expect
                .poll(() => readSavedText(page, "projects/Gallery.md"))
                .toBe(
                    "# Pics\n\n![one](../attachments/one.png)\n\n[site](https://example.com/a.png)\n\n[self](../Other.md)",
                );
            expect(await listFiles(page)).not.toContain("Gallery.md");
        },
    );

    test(
        "shows a toast naming the note and moves nothing when the destination already has that name",
        { tag: "@NOTES-016" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "Ideas.md": "root",
                "projects/IDEAS.md": "taken",
            });
            const before = await listFiles(page);

            await dragNoteOnto(page, "Ideas", "projects");

            await expect(
                notifications(page).getByText(
                    '"Ideas.md" already exists in the destination. Nothing was moved.',
                ),
            ).toBeVisible();
            await expect(
                page
                    .getByRole("navigation", { name: "Workspace" })
                    .getByRole("status"),
            ).toHaveCount(0);
            expect(await listFiles(page)).toEqual(before);
            expect(await readSavedText(page, "Ideas.md")).toBe("root");
        },
    );
});

test.describe("moving in a read-only workspace (AC-04.7)", () => {
    test(
        "shows the read-only message and changes nothing when a note is dragged in a read-only workspace",
        { tag: "@NOTES-017" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
            const before = await listFiles(page);

            await dragNoteOnto(page, "Ideas", "projects");

            await expect(page.getByText(READ_ONLY)).toBeVisible();
            expect(await listFiles(page)).toEqual(before);
            await expect(row(page, "Ideas")).toHaveAttribute("aria-level", "1");
        },
    );
});

test.describe("selecting several notes (AC-04.10)", () => {
    test(
        "adds and removes notes from the selection without opening them when Ctrl+click is used on a multiselectable tree",
        { tag: "@NOTES-018" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await expect(tree(page)).toHaveAttribute(
                "aria-multiselectable",
                "true",
            );
            await ctrlClick(page, "Todo");
            await ctrlClick(page, "Ideas");
            await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
            await expect(page.getByRole("tab")).toHaveCount(0);

            await ctrlClick(page, "Todo");
            await expect(selectedRows(page)).toHaveText(["Ideas"]);
        },
    );

    test(
        "styles a selected row with a different background than an unselected row",
        { tag: "@NOTES-019" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const background = (name: string) =>
                row(page, name).evaluate(
                    (element) => getComputedStyle(element).backgroundColor,
                );
            const plain = await background("Todo");

            await ctrlClick(page, "Ideas");
            await page.mouse.move(0, 0);

            expect(await background("Ideas")).not.toBe(plain);
            expect(await background("Todo")).toBe(plain);
        },
    );

    test(
        "selects the notes between the last clicked note and the clicked one when Shift+click is used",
        { tag: "@NOTES-020" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await ctrlClick(page, "Ideas");
            await row(page, "Todo").click({ modifiers: ["Shift"] });

            await expect(selectedRows(page)).toHaveText([
                "Ideas",
                "Notes",
                "Todo",
            ]);
        },
    );

    test(
        "skips folders and counts only visible notes when a Shift+click range crosses an expanded folder",
        { tag: "@NOTES-021" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();

            await ctrlClick(page, "Roadmap");
            await row(page, "Todo").click({ modifiers: ["Shift"] });

            await expect(selectedRows(page)).toHaveText([
                "Roadmap",
                "Ideas",
                "Notes",
                "Todo",
            ]);
        },
    );

    test(
        "extends the selection down and shrinks it back up when Shift+ArrowDown and Shift+ArrowUp are pressed",
        { tag: "@NOTES-022" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await ctrlClick(page, "Ideas");
            await row(page, "Ideas").focus();

            await page.keyboard.press("Shift+ArrowDown");
            await expect(selectedRows(page)).toHaveText(["Ideas", "Notes"]);
            await page.keyboard.press("Shift+ArrowDown");
            await expect(selectedRows(page)).toHaveText([
                "Ideas",
                "Notes",
                "Todo",
            ]);
            await page.keyboard.press("Shift+ArrowUp");
            await expect(selectedRows(page)).toHaveText(["Ideas", "Notes"]);
        },
    );

    test(
        "clears the selection when Escape is pressed",
        { tag: "@NOTES-023" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await ctrlClick(page, "Notes");
            await ctrlClick(page, "Ideas");
            await expect(selectedRows(page)).toHaveCount(2);

            await page.keyboard.press("Escape");

            await expect(selectedRows(page)).toHaveCount(0);
        },
    );

    test(
        "opens only the clicked note and replaces the selection with it when a note is clicked without modifiers",
        { tag: "@NOTES-024" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await ctrlClick(page, "Notes");
            await ctrlClick(page, "Ideas");

            await row(page, "Todo").click();

            await expect(page.getByRole("tab")).toHaveText(["Todo"]);
            await expect(selectedRows(page)).toHaveText(["Todo"]);
            await row(page, "Ideas").click({ modifiers: ["Control"] });
            await expect(selectedRows(page)).toHaveText(["Ideas"]);
        },
    );

    test(
        "leaves a folder unselected when it is Ctrl+clicked",
        { tag: "@NOTES-025" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await ctrlClick(page, "projects");

            await expect(selectedRows(page)).toHaveCount(0);
            await expect(row(page, "projects")).not.toHaveAttribute(
                "aria-selected",
            );
        },
    );
});

test.describe("moving several notes at once (AC-04.13)", () => {
    test(
        "moves every selected note and its open tab when one selected note is dragged to a folder",
        { tag: "@NOTES-026" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Todo").click();
            await expect(page.getByRole("tab", { name: "Todo" })).toBeVisible();
            await ctrlClick(page, "Ideas");
            await ctrlClick(page, "Todo");

            const dataTransfer = await dragStart(page, "Ideas");
            await expect(row(page, "Todo")).toHaveAttribute(
                "data-dragging",
                "true",
            );
            await expect(row(page, "Notes")).not.toHaveAttribute(
                "data-dragging",
            );
            await dragOverRow(page, "projects", dataTransfer);
            await dropOnRow(page, "projects", dataTransfer);

            expect(await listFiles(page)).toEqual([
                "Notes.md",
                "projects/2026/Plan.md",
                "projects/Ideas.md",
                "projects/Roadmap.md",
                "projects/Todo.md",
            ]);
            await expect(
                page.getByRole("tab", { name: "Todo" }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(row(page, "Todo")).toHaveAttribute("aria-level", "2");
            await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
            expect(await readSavedText(page, "projects/Todo.md")).toBe("todo");
        },
    );

    test(
        "moves only the dragged note and clears the selection when an unselected note is dragged",
        { tag: "@NOTES-027" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await ctrlClick(page, "Ideas");
            await ctrlClick(page, "Todo");

            await dragNoteOnto(page, "Notes", "projects");

            expect(await listFiles(page)).toEqual([
                "Ideas.md",
                "Todo.md",
                "projects/2026/Plan.md",
                "projects/Notes.md",
                "projects/Roadmap.md",
            ]);
            await expect(selectedRows(page)).toHaveCount(0);
        },
    );

    test(
        "skips selected notes already in the destination and moves the others without an error",
        { tag: "@NOTES-028" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();
            await ctrlClick(page, "Roadmap");
            await ctrlClick(page, "Ideas");

            await dragNoteOnto(page, "Ideas", "projects");

            expect(await listFiles(page)).toEqual([
                "Notes.md",
                "Todo.md",
                "projects/2026/Plan.md",
                "projects/Ideas.md",
                "projects/Roadmap.md",
            ]);
            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(
                page
                    .getByRole("navigation", { name: "Workspace" })
                    .getByRole("status"),
            ).toHaveCount(0);
        },
    );

    test(
        "moves nothing, keeps the selection and names the first colliding note in a toast when a selected note collides",
        { tag: "@NOTES-029" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "Ideas.md": "1",
                "Todo.md": "2",
                "Notes.md": "3",
                "projects/todo.md": "taken",
                "projects/NOTES.md": "taken",
            });
            const before = await listFiles(page);
            await row(page, "Notes").click();
            await ctrlClick(page, "Ideas");
            await ctrlClick(page, "Notes");
            await ctrlClick(page, "Todo");

            await dragNoteOnto(page, "Ideas", "projects");

            await expect(
                notifications(page).getByText(
                    '"Notes.md" already exists in the destination. Nothing was moved.',
                ),
            ).toBeVisible();
            await expect(
                page
                    .getByRole("navigation", { name: "Workspace" })
                    .getByRole("status"),
            ).toHaveCount(0);
            expect(await listFiles(page)).toEqual(before);
            await expect(
                page.getByRole("tab", { name: "Notes" }),
            ).toBeVisible();
            await expect(selectedRows(page)).toHaveCount(3);
        },
    );

    test(
        "shows the read-only message and keeps the selection when a selection is dragged in a read-only workspace",
        { tag: "@NOTES-030" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
            const before = await listFiles(page);
            await ctrlClick(page, "Ideas");
            await ctrlClick(page, "Todo");

            await dragNoteOnto(page, "Ideas", "projects");

            await expect(page.getByText(READ_ONLY)).toBeVisible();
            expect(await listFiles(page)).toEqual(before);
            await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
        },
    );
});

test.describe("context menu with a selection (AC-04.11)", () => {
    test(
        "offers only Delete 2 notes and keeps the selection when the context menu is opened on a selected note",
        { tag: "@NOTES-031" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await ctrlClick(page, "Ideas");
            await ctrlClick(page, "Todo");

            await row(page, "Ideas").click({ button: "right" });
            await expect(page.getByRole("menuitem")).toHaveText([
                "Delete 2 notes",
            ]);
            await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
        },
    );

    test(
        "clears the selection and offers Rename and Delete when the context menu is opened on an unselected note",
        { tag: "@NOTES-032" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await ctrlClick(page, "Ideas");
            await ctrlClick(page, "Todo");

            await row(page, "Notes").click({ button: "right" });

            await expect(page.getByRole("menuitem")).toHaveText([
                "Rename",
                "Delete",
            ]);
            await expect(selectedRows(page)).toHaveCount(0);
        },
    );

    test(
        "offers Rename and Delete when the context menu is opened on the only selected note",
        { tag: "@NOTES-033" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await ctrlClick(page, "Ideas");

            await row(page, "Ideas").click({ button: "right" });

            await expect(page.getByRole("menuitem")).toHaveText([
                "Rename",
                "Delete",
            ]);
        },
    );
});
