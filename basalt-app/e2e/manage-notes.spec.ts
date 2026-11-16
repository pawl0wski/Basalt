import { expect, test, type Page } from "@playwright/test";
import {
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
    test("shows folders first, collapsed, and a nested note by its name under its folder", async ({
        page,
    }) => {
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
        await expect(row(page, "Roadmap")).toHaveAttribute("aria-level", "2");
        await expect(tree(page).getByText("projects/Roadmap")).toHaveCount(0);
        await expect(tree(page).getByText("Roadmap.md")).toHaveCount(0);
    });

    test("selecting a nested note opens it in a tab and an editor", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        await row(page, "projects").click();
        await row(page, "Roadmap").click();

        await expect(
            page.getByRole("tab", { name: "Roadmap" }),
        ).toHaveAttribute("aria-selected", "true");
        await expect(page.locator(".cm-content")).toContainText("road");
        await expect(row(page, "Roadmap")).toHaveAttribute(
            "aria-current",
            "true",
        );
    });

    test("opening a note expands its folders", async ({ page }) => {
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
        await expect(row(page, "a")).toHaveAttribute("aria-expanded", "true");
        await expect(row(page, "b")).toHaveAttribute("aria-expanded", "true");
    });

    test("an empty folder is shown and can be expanded", async ({ page }) => {
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
    });

    test("rows at every depth have the same style and height", async ({
        page,
    }) => {
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
    });

    test("nested rows are indented further than their parent", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();
        await row(page, "2026").click();

        const left = async (name: string) =>
            (await row(page, name).locator("span").last().boundingBox())?.x ??
            0;

        expect(await left("2026")).toBeGreaterThan(await left("projects"));
        expect(await left("Plan")).toBeGreaterThan(await left("2026"));
    });
});

test.describe("the context menu (AC-04.9)", () => {
    test("right-click on a note offers Rename and Delete", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        await openMenuOn(page, "Ideas");

        await expect(page.getByRole("menuitem")).toHaveText([
            "Rename",
            "Delete",
        ]);
    });

    test("right-click on a folder offers New note and New folder", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);

        await openMenuOn(page, "projects");

        await expect(page.getByRole("menuitem")).toHaveText([
            "New note",
            "New folder",
        ]);
    });

    test("right-click on the empty area of the sidebar offers the root menu", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "Ideas.md": "" });
        await openRootMenu(page);

        await expect(page.getByRole("menuitem")).toHaveText([
            "New note",
            "New folder",
        ]);
    });

    test("right-click in an empty workspace offers the root menu", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/Empty", {});

        await page.getByText("No notes yet").click({ button: "right" });

        await expect(page.getByRole("menuitem")).toHaveText([
            "New note",
            "New folder",
        ]);
    });

    for (const [label, key] of [
        ["Shift+F10", "Shift+F10"],
        ["the Menu key", "ContextMenu"],
    ] as const) {
        test(`${label} opens the menu of the focused row and Escape returns focus to it`, async ({
            page,
        }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            await row(page, "Ideas").focus();

            await page.keyboard.press(key);

            await expect(page.getByRole("menuitem")).toHaveText([
                "Rename",
                "Delete",
            ]);
            await page.keyboard.press("Escape");
            await expect(page.getByRole("menu")).toHaveCount(0);
            await expect(row(page, "Ideas")).toBeFocused();
        });
    }

    test("the keyboard menu of a folder row is the folder menu", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").focus();

        await page.keyboard.press("Shift+F10");

        await expect(page.getByRole("menuitem")).toHaveText([
            "New note",
            "New folder",
        ]);
    });

    test("rows have no buttons, and the sidebar has no more-actions button", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();

        await expect(tree(page).getByRole("button")).toHaveCount(0);
        await expect(
            page.getByRole("button", { name: /more|actions|…|\.\.\./i }),
        ).toHaveCount(0);
    });
});

test.describe("new note in a folder (AC-04.4)", () => {
    test("creates Untitled inside the folder at once, opens it and accepts typing", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await openMenuOn(page, "projects");

        await menuItem(page, "New note").click();

        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await listFiles(page)).toContain("projects/Untitled.md");
        await expect(
            page.getByRole("tab", { name: "Untitled" }),
        ).toHaveAttribute("aria-selected", "true");
        await expect(row(page, "Untitled")).toHaveAttribute("aria-level", "2");
        await page.keyboard.type("hello");
        await expect
            .poll(() => readSavedText(page, "projects/Untitled.md"), {
                timeout: 5000,
            })
            .toBe("hello");
        expect(await listFiles(page)).not.toContain("Untitled.md");
    });

    test("a second New note in the same folder creates Untitled 1", async ({
        page,
    }) => {
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
    });

    test("the root menu and the sidebar button still create the note in the root", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();

        await page
            .getByRole("navigation", { name: "Workspace" })
            .getByRole("button", { name: "New note" })
            .click();

        await expect(row(page, "Untitled")).toHaveAttribute("aria-level", "1");
        expect(await listFiles(page)).toContain("Untitled.md");
    });

    test("in a read-only workspace nothing is created and the message is shown", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        const before = await listFiles(page);
        await openMenuOn(page, "projects");

        await menuItem(page, "New note").click();

        await expect(page.getByText(READ_ONLY)).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
        await expect(page.getByRole("tab")).toHaveCount(0);
    });
});

test.describe("new folder (AC-04.3)", () => {
    test("creates a folder in the workspace root from the root menu", async ({
        page,
    }) => {
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
    });

    test("creates a folder inside a folder and shows it expanded in view", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await openMenuOn(page, "projects");
        await menuItem(page, "New folder").click();

        await page.getByRole("textbox", { name: "Folder name" }).fill("Drafts");
        await page.keyboard.press("Enter");

        expect(await listDirectories(page)).toContain("projects/Drafts");
        await expect(row(page, "projects")).toHaveAttribute(
            "aria-expanded",
            "true",
        );
        await expect(row(page, "Drafts")).toBeVisible();
        await expect(row(page, "Drafts")).toHaveAttribute("aria-level", "2");
    });

    test("a folder created stays in the tree when the workspace changes on disk", async ({
        page,
    }) => {
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
    });

    for (const [name, message] of [
        ["PROJECTS", "A note or folder with this name already exists here."],
        ["a/b", "A name cannot contain / or \\."],
        ["Ideas.", "A name cannot end with a dot or a space."],
    ] as const) {
        test(`rejects ${name} inline and creates nothing`, async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", FILES);
            const before = await listDirectories(page);
            await openRootMenu(page);
            await menuItem(page, "New folder").click();

            await page.getByRole("textbox", { name: "Folder name" }).fill(name);

            await expect(
                page.getByRole("dialog").getByText(message),
            ).toBeVisible();
            await expect(
                page.getByRole("button", { name: "Create folder" }),
            ).toBeDisabled();
            await page.keyboard.press("Enter");
            await expect(page.getByRole("dialog")).toBeVisible();
            expect(await listDirectories(page)).toEqual(before);
        });
    }

    test("in a read-only workspace the dialog shows the read-only message and nothing is created", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        const before = await listDirectories(page);
        await openMenuOn(page, "projects");
        await menuItem(page, "New folder").click();

        await page.getByRole("textbox", { name: "Folder name" }).fill("Drafts");
        await page.keyboard.press("Enter");

        await expect(
            page.getByRole("dialog").getByText(READ_ONLY),
        ).toBeVisible();
        expect(await listDirectories(page)).toEqual(before);
    });
});

test.describe("rename (AC-04.1)", () => {
    async function startRename(page: Page, name: string) {
        await openMenuOn(page, name);
        await menuItem(page, "Rename").click();
        await expect(
            page.getByRole("dialog", { name: "Rename note" }),
        ).toBeVisible();
    }

    test("renames the file on disk and the open note stays open with its text", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();
        await row(page, "Roadmap").click();
        await expect(page.locator(".cm-content")).toContainText("road");
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
        await expect(page.getByRole("tab", { name: "Plan B" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        await expect(page.locator(".cm-content")).toContainText("road");
        await expect(row(page, "Plan B")).toHaveAttribute(
            "aria-current",
            "true",
        );
        await expect(row(page, "Plan B")).toBeFocused();
    });

    test("typing after a rename still saves to the renamed file", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "start" });
        await row(page, "a").click();
        await startRename(page, "a");
        await page.getByRole("textbox", { name: "Name" }).fill("b");
        await page.keyboard.press("Enter");
        await expect(page.getByRole("tab", { name: "b" })).toBeVisible();

        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("end");

        await expect
            .poll(() => readSavedText(page, "b.md"), { timeout: 5000 })
            .toBe("startend");
        expect(await listFiles(page)).toEqual(["b.md"]);
    });

    test("typing in the name field works right after choosing Rename", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        await startRename(page, "a");

        await page.keyboard.type("typed");

        await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
            "typed",
        );
    });

    for (const [label, name, message] of [
        ["a case-only collision", "BETA", "already exists here"],
        ["a Unicode-form-only collision", "Café", "already exists here"],
        ["a name with a separator", "x/y", "cannot contain"],
    ] as const) {
        test(`rejects ${label} inline and leaves the files unchanged`, async ({
            page,
        }) => {
            await openWorkspaceWith(page, "/work/W", {
                "alpha.md": "",
                "beta.md": "",
                "Café.md": "",
            });
            const before = await listFiles(page);
            await startRename(page, "alpha");

            await page.getByRole("textbox", { name: "Name" }).fill(name);

            await expect(
                page.getByRole("dialog").getByText(message),
            ).toBeVisible();
            await expect(
                page.getByRole("button", { name: "Rename" }),
            ).toBeDisabled();
            await page.keyboard.press("Enter");
            await expect(page.getByRole("dialog")).toBeVisible();
            expect(await listFiles(page)).toEqual(before);
        });
    }

    test("allows a case-only change of the note's own name", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "ideas.md": "keep" });
        await startRename(page, "ideas");

        await page.getByRole("textbox", { name: "Name" }).fill("Ideas");
        await page.keyboard.press("Enter");

        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await listFiles(page)).toEqual(["Ideas.md"]);
        expect(await readSavedText(page, "Ideas.md")).toBe("keep");
    });

    test("a name that collides only in another folder is allowed", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();
        await startRename(page, "Roadmap");

        await page.getByRole("textbox", { name: "Name" }).fill("Ideas");
        await page.keyboard.press("Enter");

        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await listFiles(page)).toContain("projects/Ideas.md");
    });

    test("Escape cancels without a change and returns focus to the row", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        const before = await listFiles(page);
        await startRename(page, "Ideas");

        await page.keyboard.type("zzz");
        await page.keyboard.press("Escape");

        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await listFiles(page)).toEqual(before);
        await expect(row(page, "Ideas")).toBeFocused();
    });

    test("in a read-only workspace the dialog shows the read-only message and nothing changes", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        const before = await listFiles(page);
        await startRename(page, "Ideas");

        await page.getByRole("textbox", { name: "Name" }).fill("Other");
        await page.keyboard.press("Enter");

        await expect(
            page.getByRole("dialog").getByText(READ_ONLY),
        ).toBeVisible();
        expect(await listFiles(page)).toEqual(before);
    });
});
