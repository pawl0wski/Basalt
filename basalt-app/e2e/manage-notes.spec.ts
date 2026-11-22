import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
    listDirectories,
    listFiles,
    openWorkspaceWith,
    readSavedText,
} from "./support";

const READ_ONLY = "The workspace folder is read-only. Nothing was changed.";

function tree(page: Page) {
    return page.getByRole("tree", { name: "Notes" });
}

function row(page: Page, name: string) {
    return tree(page).getByRole("treeitem", { name, exact: true });
}

async function openMenuOn(page: Page, name: string) {
    await row(page, name).click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
}

async function openRootMenu(page: Page) {
    const box = await page
        .getByRole("navigation", { name: "Workspace" })
        .boundingBox();
    if (!box) throw new Error("The sidebar is not visible.");
    await page.mouse.click(box.x + 40, box.y + box.height - 40, {
        button: "right",
    });
    await expect(page.getByRole("menu")).toBeVisible();
}

function menuItem(page: Page, name: string) {
    return page.getByRole("menuitem", { name, exact: true });
}

const FILES = {
    "Ideas.md": "ideas",
    "projects/Roadmap.md": "road",
    "projects/2026/Plan.md": "plan",
};

test.describe("the folder tree (AC-04.6, AC-04.8)", () => {
    test(
        "shows folders first and collapsed and a nested note under its folder by its own name when a workspace is opened",
        { tag: "@NOTES-034" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await expect(tree(page).getByRole("treeitem")).toHaveText([
                "projects",
                "Ideas",
            ]);
            await expect(row(page, "projects")).toHaveAttribute(
                "aria-expanded",
                "false",
            );

            await row(page, "projects").click();

            await expect(tree(page).getByRole("treeitem")).toHaveText([
                "projects",
                "2026",
                "Roadmap",
                "Ideas",
            ]);
            await expect(row(page, "Roadmap")).toHaveAttribute(
                "aria-level",
                "2",
            );
            await expect(tree(page).getByText("projects/Roadmap")).toHaveCount(
                0,
            );
            await expect(tree(page).getByText("Roadmap.md")).toHaveCount(0);
        },
    );

    test(
        "opens a nested note in a tab and an editor when it is chosen in its expanded folder",
        { tag: "@NOTES-035" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await row(page, "projects").click();
            await row(page, "Roadmap").click();

            await expect(
                page.getByRole("tab", { name: "Roadmap" }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(
                page.getByRole("textbox", { name: /Roadmap|Plan B/ }),
            ).toContainText("road");
            await expect(row(page, "Roadmap")).toHaveAttribute(
                "aria-current",
                "true",
            );
        },
    );

    test(
        "expands the folders of a note when the note is opened",
        { tag: "@NOTES-036" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a/b/Deep.md": "deep",
                "other.md": "",
            });
            await row(page, "a").click();
            await row(page, "b").click();
            await row(page, "Deep").click();
            await row(page, "a").click();
            await expect(row(page, "b")).toHaveCount(0);

            await page.getByRole("tab", { name: "Deep" }).click();
            await row(page, "other").click();
            await page.getByRole("tab", { name: "Deep" }).click();

            await expect(row(page, "Deep")).toBeVisible();
            await expect(row(page, "a")).toHaveAttribute(
                "aria-expanded",
                "true",
            );
            await expect(row(page, "b")).toHaveAttribute(
                "aria-expanded",
                "true",
            );
        },
    );

    test(
        "shows an empty folder and lets it be expanded",
        { tag: "@NOTES-037" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "empty/.keep": "",
                "other.md": "",
            });

            await expect(tree(page).getByRole("treeitem")).toHaveText([
                "empty",
                "other",
            ]);
            await row(page, "empty").click();
            await expect(row(page, "empty")).toHaveAttribute(
                "aria-expanded",
                "true",
            );
            await expect(tree(page).getByRole("treeitem")).toHaveCount(2);
        },
    );

    test(
        "gives rows at every depth the same style and height",
        { tag: "@NOTES-038" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();
            await row(page, "2026").click();

            const style = (name: string) =>
                row(page, name).evaluate((element) => {
                    const computed = getComputedStyle(element);
                    return {
                        height: element.getBoundingClientRect().height,
                        fontSize: computed.fontSize,
                        fontWeight: computed.fontWeight,
                        color: computed.color,
                        borderRadius: computed.borderRadius,
                        display: computed.display,
                    };
                });

            const top = await style("Ideas");
            expect(top.height).toBeGreaterThan(0);
            expect(await style("Roadmap")).toEqual(top);
            expect(await style("Plan")).toEqual(top);
            const folderTop = await style("projects");
            expect(await style("2026")).toEqual(folderTop);
            expect(folderTop).toEqual(top);
        },
    );

    test(
        "indents each nested row further than its parent",
        { tag: "@NOTES-039" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();
            await row(page, "2026").click();

            const left = async (name: string) =>
                (
                    await row(page, name)
                        .getByText(name, { exact: true })
                        .boundingBox()
                )?.x ?? 0;

            expect(await left("2026")).toBeGreaterThan(await left("projects"));
            expect(await left("Plan")).toBeGreaterThan(await left("2026"));
        },
    );
});

test.describe("the context menu (AC-04.9)", () => {
    test(
        "offers Rename and Delete when the context menu is opened on a note",
        { tag: "@NOTES-040" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await openMenuOn(page, "Ideas");

            await expect(page.getByRole("menuitem")).toHaveText([
                "Rename",
                "Delete",
            ]);
        },
    );

    test(
        "offers New note, New folder, Rename and Delete when the context menu is opened on a folder",
        { tag: "@NOTES-041" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);

            await openMenuOn(page, "projects");

            await expect(page.getByRole("menuitem")).toHaveText([
                "New note",
                "New folder",
                "Rename",
                "Delete",
            ]);
        },
    );

    test(
        "offers the root menu when the context menu is opened on the empty area of the sidebar",
        { tag: "@NOTES-042" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "Ideas.md": "" });
            await openRootMenu(page);

            await expect(page.getByRole("menuitem")).toHaveText([
                "New note",
                "New folder",
            ]);
        },
    );

    test(
        "offers the root menu when the context menu is opened in an empty workspace",
        { tag: "@NOTES-043" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/Empty", {});

            await page.getByText("No notes yet").click({ button: "right" });

            await expect(page.getByRole("menuitem")).toHaveText([
                "New note",
                "New folder",
            ]);
        },
    );

    test(
        "opens the note menu of the focused row and returns focus to the row on Escape when Shift+F10 is pressed",
        { tag: "@NOTES-044" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").focus();

            await page.keyboard.press("Shift+F10");

            await expect(page.getByRole("menuitem")).toHaveText([
                "Rename",
                "Delete",
            ]);
            await page.keyboard.press("Escape");
            await expect(page.getByRole("menu")).toHaveCount(0);
            await expect(row(page, "Ideas")).toBeFocused();
        },
    );

    test(
        "opens the note menu of the focused row and returns focus to the row on Escape when the Menu key is pressed",
        { tag: "@NOTES-045" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").focus();

            await page.keyboard.press("ContextMenu");

            await expect(page.getByRole("menuitem")).toHaveText([
                "Rename",
                "Delete",
            ]);
            await page.keyboard.press("Escape");
            await expect(page.getByRole("menu")).toHaveCount(0);
            await expect(row(page, "Ideas")).toBeFocused();
        },
    );

    test(
        "offers the folder menu when Shift+F10 is pressed on a focused folder row",
        { tag: "@NOTES-046" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").focus();

            await page.keyboard.press("Shift+F10");

            await expect(page.getByRole("menuitem")).toHaveText([
                "New note",
                "New folder",
                "Rename",
                "Delete",
            ]);
        },
    );

    test(
        "shows no buttons in tree rows and no more-actions button in the sidebar",
        { tag: "@NOTES-047" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();

            await expect(tree(page).getByRole("button")).toHaveCount(0);
            await expect(
                page.getByRole("button", { name: /more|actions|…|\.\.\./i }),
            ).toHaveCount(0);
        },
    );
});

test.describe("new note in a folder (AC-04.4)", () => {
    test(
        "creates Untitled inside the folder at once, opens it and saves the typed text there when New note is chosen in a folder menu",
        { tag: "@NOTES-048" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", FILES);
            await freezeClock(page);
            await openMenuOn(page, "projects");

            await menuItem(page, "New note").click();

            await expect(page.getByRole("dialog")).toHaveCount(0);
            expect(await listFiles(page)).toContain("projects/Untitled.md");
            await expect(
                page.getByRole("tab", { name: "Untitled" }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(row(page, "Untitled")).toHaveAttribute(
                "aria-level",
                "2",
            );
            await page.keyboard.type("hello");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "projects/Untitled.md"))
                .toBe("# hello");
            expect(await listFiles(page)).not.toContain("Untitled.md");
        },
    );

    test(
        "creates Untitled 1 when New note is chosen a second time in the same folder",
        { tag: "@NOTES-049" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await openMenuOn(page, "projects");
            await menuItem(page, "New note").click();
            await expect(row(page, "Untitled")).toBeVisible();

            await openMenuOn(page, "projects");
            await menuItem(page, "New note").click();

            await expect(row(page, "Untitled 1")).toBeVisible();
            expect(await listFiles(page)).toEqual(
                expect.arrayContaining([
                    "projects/Untitled.md",
                    "projects/Untitled 1.md",
                ]),
            );
        },
    );

    test(
        "creates the note in the workspace root when New note is chosen from the root menu or the sidebar button",
        { tag: "@NOTES-050" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();

            await page
                .getByRole("navigation", { name: "Workspace" })
                .getByRole("button", { name: "New note" })
                .click();

            await expect(row(page, "Untitled")).toHaveAttribute(
                "aria-level",
                "1",
            );
            expect(await listFiles(page)).toContain("Untitled.md");
        },
    );

    test(
        "shows the read-only message and creates nothing when New note is chosen in a read-only workspace",
        { tag: "@NOTES-051" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
            const before = await listFiles(page);
            await openMenuOn(page, "projects");

            await menuItem(page, "New note").click();

            await expect(page.getByText(READ_ONLY)).toBeVisible();
            expect(await listFiles(page)).toEqual(before);
            await expect(page.getByRole("tab")).toHaveCount(0);
        },
    );
});

test.describe("new folder (AC-04.3)", () => {
    test(
        "creates a folder in the workspace root when New folder is chosen from the root menu",
        { tag: "@NOTES-052" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "Ideas.md": "" });
            await openRootMenu(page);
            await menuItem(page, "New folder").click();

            await page
                .getByRole("textbox", { name: "Folder name" })
                .fill("Archive");
            await page.getByRole("button", { name: "Create folder" }).click();

            await expect(page.getByRole("dialog")).toHaveCount(0);
            expect(await listDirectories(page)).toEqual(["Archive"]);
            await expect(row(page, "Archive")).toBeVisible();
            await expect(row(page, "Archive")).toBeFocused();
        },
    );

    test(
        "creates a folder inside a folder and shows it expanded in view when New folder is chosen from a folder menu",
        { tag: "@NOTES-053" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await openMenuOn(page, "projects");
            await menuItem(page, "New folder").click();

            await page
                .getByRole("textbox", { name: "Folder name" })
                .fill("Drafts");
            await page.keyboard.press("Enter");

            expect(await listDirectories(page)).toContain("projects/Drafts");
            await expect(row(page, "projects")).toHaveAttribute(
                "aria-expanded",
                "true",
            );
            await expect(row(page, "Drafts")).toBeVisible();
            await expect(row(page, "Drafts")).toHaveAttribute(
                "aria-level",
                "2",
            );
        },
    );

    test(
        "keeps a created folder in the tree when the workspace changes on disk afterwards",
        { tag: "@NOTES-054" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await openRootMenu(page);
            await menuItem(page, "New folder").click();
            await page.keyboard.type("Later");
            await page.keyboard.press("Enter");
            await expect(row(page, "Later")).toBeVisible();

            await page.evaluate(() => {
                window.__basaltTestFs?.externalWrite(
                    "projects/new.md",
                    new TextEncoder().encode(""),
                );
            });
            await row(page, "projects").click();

            await expect(row(page, "new")).toBeVisible();
            await expect(row(page, "Later")).toBeVisible();
        },
    );

    test(
        "closes the dialog, shows an already-exists toast and creates nothing when a new folder name differs only by case from an existing folder",
        { tag: "@NOTES-055" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const before = await listDirectories(page);
            await openRootMenu(page);
            await menuItem(page, "New folder").click();
            await page
                .getByRole("textbox", { name: "Folder name" })
                .fill("PROJECTS");
            await page.getByRole("button", { name: "Create folder" }).click();

            await expect(page.getByRole("dialog")).toHaveCount(0);
            await expect(
                page.getByRole("region", { name: /Notifications/ }),
            ).toContainText("already exists");
            expect(await listDirectories(page)).toEqual(before);
        },
    );

    test(
        "disables Create folder, shows the separator message inline and creates nothing when the folder name contains a slash",
        { tag: "@NOTES-056" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const before = await listDirectories(page);
            await openRootMenu(page);
            await menuItem(page, "New folder").click();

            await page
                .getByRole("textbox", { name: "Folder name" })
                .fill("a/b");

            await expect(
                page
                    .getByRole("dialog")
                    .getByText("A name cannot contain / or \\."),
            ).toBeVisible();
            await expect(
                page.getByRole("button", { name: "Create folder" }),
            ).toBeDisabled();
            await page.keyboard.press("Enter");
            await expect(page.getByRole("dialog")).toBeVisible();
            expect(await listDirectories(page)).toEqual(before);
        },
    );

    test(
        "disables Create folder, shows the trailing-dot message inline and creates nothing when the folder name ends with a dot",
        { tag: "@NOTES-057" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const before = await listDirectories(page);
            await openRootMenu(page);
            await menuItem(page, "New folder").click();

            await page
                .getByRole("textbox", { name: "Folder name" })
                .fill("Ideas.");

            await expect(
                page
                    .getByRole("dialog")
                    .getByText("A name cannot end with a dot or a space."),
            ).toBeVisible();
            await expect(
                page.getByRole("button", { name: "Create folder" }),
            ).toBeDisabled();
            await page.keyboard.press("Enter");
            await expect(page.getByRole("dialog")).toBeVisible();
            expect(await listDirectories(page)).toEqual(before);
        },
    );

    test(
        "shows the read-only message in the New folder dialog and creates nothing in a read-only workspace",
        { tag: "@NOTES-058" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
            const before = await listDirectories(page);
            await openMenuOn(page, "projects");
            await menuItem(page, "New folder").click();

            await page
                .getByRole("textbox", { name: "Folder name" })
                .fill("Drafts");
            await page.keyboard.press("Enter");

            await expect(
                page.getByRole("dialog").getByText(READ_ONLY),
            ).toBeVisible();
            expect(await listDirectories(page)).toEqual(before);
        },
    );
});

test.describe("rename (AC-04.1)", () => {
    async function startRename(page: Page, name: string) {
        await openMenuOn(page, name);
        await menuItem(page, "Rename").click();
        await expect(
            page.getByRole("dialog", { name: "Rename note" }),
        ).toBeVisible();
    }

    test(
        "renames the file on disk and keeps the open note, its text and its tab when a note is renamed",
        { tag: "@NOTES-059" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();
            await row(page, "Roadmap").click();
            await expect(
                page.getByRole("textbox", { name: /Roadmap|Plan B/ }),
            ).toContainText("road");
            await startRename(page, "Roadmap");
            const input = page.getByRole("textbox", { name: "Name" });
            await expect(input).toHaveValue("Roadmap");

            await input.fill("Plan B");
            await page.keyboard.press("Enter");

            await expect(page.getByRole("dialog")).toHaveCount(0);
            expect(await listFiles(page)).toEqual([
                "Ideas.md",
                "projects/2026/Plan.md",
                "projects/Plan B.md",
            ]);
            await expect(page.getByRole("tab")).toHaveText(["Plan B"]);
            await expect(
                page.getByRole("tab", { name: "Plan B" }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(
                page.getByRole("textbox", { name: /Roadmap|Plan B/ }),
            ).toContainText("road");
            await expect(row(page, "Plan B")).toHaveAttribute(
                "aria-current",
                "true",
            );
            await expect(row(page, "Plan B")).toBeFocused();
        },
    );

    test(
        "saves later typing to the renamed file when a note is renamed and then edited",
        { tag: "@NOTES-060" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", { "a.md": "start" });
            await freezeClock(page);
            await row(page, "a").click();
            await startRename(page, "a");
            await page.getByRole("textbox", { name: "Name" }).fill("b");
            await page.keyboard.press("Enter");
            await expect(page.getByRole("tab", { name: "b" })).toBeVisible();

            await page.getByRole("textbox", { name: "b" }).click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type("end");
            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect
                .poll(() => readSavedText(page, "b.md"))
                .toBe("# b\n\nstartend");
            expect(await listFiles(page)).toEqual(["b.md"]);
        },
    );

    test(
        "accepts typing in the name field right after Rename is chosen",
        { tag: "@NOTES-061" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "" });
            await startRename(page, "a");

            await page.keyboard.type("typed");

            await expect(
                page.getByRole("textbox", { name: "Name" }),
            ).toHaveValue("typed");
        },
    );

    test(
        "closes the Rename dialog, shows an already-exists toast and changes nothing when the new name differs only by case from another note",
        { tag: "@NOTES-062" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "alpha.md": "source",
                "beta.md": "case collision",
                "Café.md": "Unicode collision",
            });
            const before = await listFiles(page);
            await startRename(page, "alpha");
            await page.getByRole("textbox", { name: "Name" }).fill("BETA");
            await page.keyboard.press("Enter");

            await expect(page.getByRole("dialog")).toHaveCount(0);
            await expect(
                page.getByRole("region", { name: /Notifications/ }),
            ).toContainText("already exists");
            expect(await listFiles(page)).toEqual(before);
            expect(await readSavedText(page, "alpha.md")).toBe("source");
        },
    );

    test(
        "closes the Rename dialog, shows an already-exists toast and changes nothing when the new name differs only by Unicode form from another note",
        { tag: "@NOTES-063" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "alpha.md": "source",
                "beta.md": "case collision",
                "Café.md": "Unicode collision",
            });
            const before = await listFiles(page);
            await startRename(page, "alpha");
            await page.getByRole("textbox", { name: "Name" }).fill("Café");
            await page.keyboard.press("Enter");

            await expect(page.getByRole("dialog")).toHaveCount(0);
            await expect(
                page.getByRole("region", { name: /Notifications/ }),
            ).toContainText("already exists");
            expect(await listFiles(page)).toEqual(before);
            expect(await readSavedText(page, "alpha.md")).toBe("source");
        },
    );

    test(
        "rejects a name with a separator inline and leaves the file unchanged when a note is renamed",
        { tag: "@NOTES-064" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "alpha.md": "source" });
            await startRename(page, "alpha");
            const dialog = page.getByRole("dialog");

            await dialog.getByRole("textbox", { name: "Name" }).fill("x/y");

            await expect(dialog.getByText("cannot contain")).toBeVisible();
            await expect(
                dialog.getByRole("button", { name: "Rename" }),
            ).toBeDisabled();
            await page.keyboard.press("Enter");
            await expect(dialog).toBeVisible();
            expect(await listFiles(page)).toEqual(["alpha.md"]);
        },
    );

    test(
        "renames the file when only the case of the note's own name is changed",
        { tag: "@NOTES-065" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "ideas.md": "keep" });
            await startRename(page, "ideas");

            await page.getByRole("textbox", { name: "Name" }).fill("Ideas");
            await page.keyboard.press("Enter");

            await expect(page.getByRole("dialog")).toHaveCount(0);
            expect(await listFiles(page)).toEqual(["Ideas.md"]);
            expect(await readSavedText(page, "Ideas.md")).toBe(
                "# Ideas\n\nkeep",
            );
        },
    );

    test(
        "renames the note when the new name exists only in another folder",
        { tag: "@NOTES-066" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "projects").click();
            await startRename(page, "Roadmap");

            await page.getByRole("textbox", { name: "Name" }).fill("Ideas");
            await page.keyboard.press("Enter");

            await expect(page.getByRole("dialog")).toHaveCount(0);
            expect(await listFiles(page)).toContain("projects/Ideas.md");
        },
    );

    test(
        "cancels the rename, changes nothing and returns focus to the row when Escape is pressed in the dialog",
        { tag: "@NOTES-067" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const before = await listFiles(page);
            await startRename(page, "Ideas");

            await page.keyboard.type("zzz");
            await page.keyboard.press("Escape");

            await expect(page.getByRole("dialog")).toHaveCount(0);
            expect(await listFiles(page)).toEqual(before);
            await expect(row(page, "Ideas")).toBeFocused();
        },
    );

    test(
        "shows the read-only message in the Rename dialog and changes nothing in a read-only workspace",
        { tag: "@NOTES-068" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
            const before = await listFiles(page);
            await startRename(page, "Ideas");

            await page.getByRole("textbox", { name: "Name" }).fill("Other");
            await page.keyboard.press("Enter");

            await expect(
                page.getByRole("dialog").getByText(READ_ONLY),
            ).toBeVisible();
            expect(await listFiles(page)).toEqual(before);
        },
    );
});
