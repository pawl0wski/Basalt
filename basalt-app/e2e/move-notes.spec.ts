import { expect, test, type JSHandle, type Page } from "@playwright/test";
import { listFiles, openWorkspaceWith, readSavedText } from "./support";

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
    test("dropping a note on a folder moves the file and the folder opens to show it", async ({
        page,
    }) => {
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
        expect(await readSavedText(page, "projects/Ideas.md")).toBe("ideas");
    });

    test("a real pointer drag with the mouse moves the note too", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        await row(page, "Ideas").dragTo(row(page, "projects"));

        await expect.poll(() => listFiles(page)).toContain("projects/Ideas.md");
        expect(await listFiles(page)).not.toContain("Ideas.md");
    });

    test("the open tab follows the note, keeps its text and still saves to the new path", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "Ideas").click();
        await expect(page.locator(".cm-content")).toContainText("ideas");

        await dragNoteOnto(page, "Ideas", "projects");

        await expect(page.getByRole("tab")).toHaveText(["Ideas"]);
        await expect(page.getByRole("tab", { name: "Ideas" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        await expect(page.locator(".cm-content")).toContainText("ideas");
        await expect(row(page, "Ideas")).toHaveAttribute(
            "aria-current",
            "true",
        );
        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("!");
        await expect
            .poll(() => readSavedText(page, "projects/Ideas.md"), {
                timeout: 5000,
            })
            .toBe("ideas!");
        expect(await listFiles(page)).not.toContain("Ideas.md");
    });

    test("unsaved text is saved before the move", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "Ideas").click();
        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type(" more");

        await dragNoteOnto(page, "Ideas", "projects");

        await expect
            .poll(() => readSavedText(page, "projects/Ideas.md"))
            .toBe("ideas more");
    });

    test("dropping on the empty area of the sidebar moves a nested note to the workspace root", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();
        await row(page, "Roadmap").click();

        const dataTransfer = await dragStart(page, "Roadmap");
        await dragOverRoot(page, dataTransfer);
        await expect(tree(page)).toHaveCSS("outline-style", /solid|auto/);
        await dropOnRoot(page, dataTransfer);

        expect(await listFiles(page)).toContain("Roadmap.md");
        expect(await listFiles(page)).not.toContain("projects/Roadmap.md");
        await expect(page.getByRole("tab", { name: "Roadmap" })).toBeVisible();
        await expect(row(page, "Roadmap")).toHaveAttribute("aria-level", "1");
    });

    test("the folder is highlighted only while it is the drop target", async ({
        page,
    }) => {
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
    });

    test("a collapsed folder opens after hovering it for a while during a drag", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        const dataTransfer = await dragStart(page, "Ideas");

        await dragOverRow(page, "projects", dataTransfer);

        await expect(row(page, "projects")).toHaveAttribute(
            "aria-expanded",
            "false",
        );
        await expect(row(page, "projects")).toHaveAttribute(
            "aria-expanded",
            "true",
        );
        await expect(row(page, "Roadmap")).toBeVisible();
    });

    test("leaving the folder before the delay keeps it closed", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        const dataTransfer = await dragStart(page, "Ideas");

        await dragOverRow(page, "projects", dataTransfer);
        await dragOverRow(page, "Todo", dataTransfer);
        await page.waitForTimeout(900);

        await expect(row(page, "projects")).toHaveAttribute(
            "aria-expanded",
            "false",
        );
    });

    test("dropping on the note's own folder is ignored: no highlight, no change, no error", async ({
        page,
    }) => {
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
        await expect(page.locator(".bs-alert")).toHaveCount(0);
        await expect(row(page, "Roadmap")).toHaveAttribute("aria-level", "2");
    });

    test("dropping a root note on the root area is ignored", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        const before = await listFiles(page);

        const dataTransfer = await dragStart(page, "Ideas");
        await dragOverRoot(page, dataTransfer);
        await dropOnRoot(page, dataTransfer);

        expect(await listFiles(page)).toEqual(before);
        await expect(page.locator(".bs-alert")).toHaveCount(0);
    });

    test("a drag that ends elsewhere changes nothing and clears the highlight", async ({
        page,
    }) => {
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
        await expect(row(page, "Ideas")).not.toHaveAttribute("data-dragging");
        await dragOverRow(page, "projects", dataTransfer);
        await expect(row(page, "projects")).not.toHaveAttribute(
            "data-drop-target",
            "true",
        );
    });

    test("a relative image link in the moved note is rewritten and other text is kept", async ({
        page,
    }) => {
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
    });

    test("a collision shows a message naming the note and moves nothing", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "Ideas.md": "root",
            "projects/IDEAS.md": "taken",
        });
        const before = await listFiles(page);

        await dragNoteOnto(page, "Ideas", "projects");

        await expect(
            page.getByText(
                '"Ideas.md" already exists in the destination. Nothing was moved.',
            ),
        ).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
        expect(await readSavedText(page, "Ideas.md")).toBe("root");
    });
});

test.describe("moving in a read-only workspace (AC-04.7)", () => {
    test("shows the read-only message and changes nothing", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        const before = await listFiles(page);

        await dragNoteOnto(page, "Ideas", "projects");

        await expect(page.getByText(READ_ONLY)).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
        await expect(row(page, "Ideas")).toHaveAttribute("aria-level", "1");
    });
});

test.describe("selecting several notes (AC-04.10)", () => {
    test("Ctrl+click adds and removes notes without opening them, and the tree is multiselectable", async ({
        page,
    }) => {
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
    });

    test("selected rows look different from unselected rows", async ({
        page,
    }) => {
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
    });

    test("Shift+click selects the visible notes between the last clicked note and the clicked one", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        await ctrlClick(page, "Ideas");
        await row(page, "Todo").click({ modifiers: ["Shift"] });

        await expect(selectedRows(page)).toHaveText(["Ideas", "Notes", "Todo"]);
    });

    test("Shift+click range counts only visible notes and skips folders", async ({
        page,
    }) => {
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
    });

    test("Shift+Arrow extends the selection down and back up", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Ideas");
        await row(page, "Ideas").focus();

        await page.keyboard.press("Shift+ArrowDown");
        await expect(selectedRows(page)).toHaveText(["Ideas", "Notes"]);
        await page.keyboard.press("Shift+ArrowDown");
        await expect(selectedRows(page)).toHaveText(["Ideas", "Notes", "Todo"]);
        await page.keyboard.press("Shift+ArrowUp");
        await expect(selectedRows(page)).toHaveText(["Ideas", "Notes"]);
    });

    test("Escape clears the selection", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Notes");
        await ctrlClick(page, "Ideas");
        await expect(selectedRows(page)).toHaveCount(2);

        await page.keyboard.press("Escape");

        await expect(selectedRows(page)).toHaveCount(0);
    });

    test("a plain click opens one note and clears the selection", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Notes");
        await ctrlClick(page, "Ideas");

        await row(page, "Todo").click();

        await expect(page.getByRole("tab")).toHaveText(["Todo"]);
        await expect(selectedRows(page)).toHaveText(["Todo"]);
        await row(page, "Ideas").click({ modifiers: ["Control"] });
        await expect(selectedRows(page)).toHaveText(["Ideas"]);
    });

    test("folders are never selected by a modified click", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        await ctrlClick(page, "projects");

        await expect(selectedRows(page)).toHaveCount(0);
        await expect(row(page, "projects")).not.toHaveAttribute(
            "aria-selected",
        );
    });
});

test.describe("moving several notes at once (AC-04.13)", () => {
    test("dragging one selected note moves the whole selection and every open tab follows", async ({
        page,
    }) => {
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
        await expect(row(page, "Notes")).not.toHaveAttribute("data-dragging");
        await dragOverRow(page, "projects", dataTransfer);
        await dropOnRow(page, "projects", dataTransfer);

        expect(await listFiles(page)).toEqual([
            "Notes.md",
            "projects/2026/Plan.md",
            "projects/Ideas.md",
            "projects/Roadmap.md",
            "projects/Todo.md",
        ]);
        await expect(page.getByRole("tab", { name: "Todo" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        await expect(row(page, "Todo")).toHaveAttribute("aria-level", "2");
        await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
        expect(await readSavedText(page, "projects/Todo.md")).toBe("todo");
    });

    test("dragging an unselected note moves only that note and clears the selection", async ({
        page,
    }) => {
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
    });

    test("notes already in the destination are skipped and the others move", async ({
        page,
    }) => {
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
        await expect(page.locator(".bs-alert")).toHaveCount(0);
    });

    test("a collision moves nothing and names the first colliding note", async ({
        page,
    }) => {
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
            page.getByText(
                '"Notes.md" already exists in the destination. Nothing was moved.',
            ),
        ).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
        await expect(page.getByRole("tab", { name: "Notes" })).toBeVisible();
        await expect(selectedRows(page)).toHaveCount(3);
    });

    test("a move in a read-only workspace shows the message and keeps the selection", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        const before = await listFiles(page);
        await ctrlClick(page, "Ideas");
        await ctrlClick(page, "Todo");

        await dragNoteOnto(page, "Ideas", "projects");

        await expect(page.getByText(READ_ONLY)).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
        await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
    });
});

test.describe("context menu with a selection (AC-04.11)", () => {
    test("is not shown for a note of a multi-selection", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Ideas");
        await ctrlClick(page, "Todo");

        await row(page, "Ideas").click({ button: "right" });
        await row(page, "Ideas").focus();
        await page.keyboard.press("Shift+F10");

        await expect(page.getByRole("menu")).toHaveCount(0);
        await expect(selectedRows(page)).toHaveText(["Ideas", "Todo"]);
    });

    test("right-clicking an unselected note clears the selection and shows that note's menu", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Ideas");
        await ctrlClick(page, "Todo");

        await row(page, "Notes").click({ button: "right" });

        await expect(page.getByRole("menuitem")).toHaveText(["Rename"]);
        await expect(selectedRows(page)).toHaveCount(0);
    });

    test("a selection of one note shows the normal note menu", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await ctrlClick(page, "Ideas");

        await row(page, "Ideas").click({ button: "right" });

        await expect(page.getByRole("menuitem")).toHaveText(["Rename"]);
    });
});
