import { expect, test, type JSHandle, type Page } from "@playwright/test";
import {
    listDirectories,
    listFiles,
    openWorkspaceWith,
    readSavedText,
    setReadOnly,
} from "./support";

const FILES = {
    "Ideas.md": "ideas",
    "projects/Roadmap.md": "road",
    "projects/2026/Plan.md": "[side](../Roadmap.md)",
    "archive/Old.md": "old",
};

function tree(page: Page) {
    return page.getByRole("tree", { name: "Notes" });
}

function row(page: Page, name: string) {
    return tree(page).getByRole("treeitem", { name, exact: true });
}

function menuItem(page: Page, name: string) {
    return page.getByRole("menuitem", { name, exact: true });
}

async function openMenuOn(page: Page, name: string) {
    await row(page, name).click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
}

async function startRename(page: Page, name: string) {
    await openMenuOn(page, name);
    await menuItem(page, "Rename").click();
    await expect(
        page.getByRole("dialog", { name: "Rename folder" }),
    ).toBeVisible();
}

async function dragFolderOnto(page: Page, folder: string, target: string) {
    const dataTransfer: JSHandle = await page.evaluateHandle(
        () => new DataTransfer(),
    );
    await row(page, folder).dispatchEvent("dragstart", { dataTransfer });
    await row(page, target).dispatchEvent("dragover", { dataTransfer });
    await row(page, target).dispatchEvent("drop", { dataTransfer });
    await row(page, folder).dispatchEvent("dragend", { dataTransfer });
}

test.describe("rename a folder (AC-05.1, AC-05.5, AC-05.6)", () => {
    test("renames the directory, keeps it expanded and the open tab follows", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();
        await row(page, "Roadmap").click();
        await expect(page.getByRole("tab")).toHaveText(["Roadmap"]);

        await startRename(page, "projects");
        await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
            "projects",
        );
        await page.getByRole("textbox", { name: "Name" }).fill("Work");
        await page.keyboard.press("Enter");

        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await listFiles(page)).toEqual([
            "Ideas.md",
            "Work/2026/Plan.md",
            "Work/Roadmap.md",
            "archive/Old.md",
        ]);
        await expect(row(page, "Work")).toHaveAttribute(
            "aria-expanded",
            "true",
        );
        await expect(row(page, "Roadmap")).toBeVisible();
        await expect(page.getByRole("tab")).toHaveText(["Roadmap"]);
        await expect(page.locator(".cm-content")).toContainText("road");
    });

    test("typing after the rename still saves to the renamed folder", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "d/a.md": "start" });
        await row(page, "d").click();
        await row(page, "a").click();
        await startRename(page, "d");
        await page.getByRole("textbox", { name: "Name" }).fill("e");
        await page.keyboard.press("Enter");
        await expect(row(page, "e")).toBeVisible();

        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("!");

        await expect
            .poll(() => readSavedText(page, "e/a.md"), { timeout: 5000 })
            .toBe("start!");
    });

    test("a colliding name, including case-only, is rejected without a change", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await startRename(page, "projects");

        await page.getByRole("textbox", { name: "Name" }).fill("ARCHIVE");
        await page.keyboard.press("Enter");

        expect(await listDirectories(page)).toContain("projects");
        expect(await listDirectories(page)).toContain("archive");
    });

    test("a case-only change of the folder's own name is allowed", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await startRename(page, "projects");

        await page.getByRole("textbox", { name: "Name" }).fill("Projects");
        await page.keyboard.press("Enter");

        await expect(page.getByRole("dialog")).toHaveCount(0);
        expect(await listFiles(page)).toContain("Projects/Roadmap.md");
    });

    test("the root name attachments is reserved", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await startRename(page, "projects");

        await page.getByRole("textbox", { name: "Name" }).fill("attachments");

        await expect(
            page
                .getByRole("dialog", { name: "Rename folder" })
                .getByText("This name is reserved for attachments."),
        ).toBeVisible();
        await page.keyboard.press("Enter");
        expect(await listDirectories(page)).toContain("projects");
    });

    test("unsaved notes inside are saved before the rename", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "d/a.md": "base" });
        await row(page, "d").click();
        await row(page, "a").click();
        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("+typed");

        await startRename(page, "d");
        await page.getByRole("textbox", { name: "Name" }).fill("e");
        await page.keyboard.press("Enter");

        await expect(row(page, "e")).toBeVisible();
        expect(await readSavedText(page, "e/a.md")).toBe("base+typed");
    });

    test("the workspace root offers no folder actions", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        const box = await page
            .getByRole("navigation", { name: "Workspace" })
            .boundingBox();
        if (!box) throw new Error("The sidebar is not visible.");

        await page.mouse.click(box.x + 40, box.y + box.height - 40, {
            button: "right",
        });

        await expect(page.getByRole("menu")).toBeVisible();
        await expect(menuItem(page, "Rename")).toHaveCount(0);
        await expect(menuItem(page, "Delete")).toHaveCount(0);
    });

    test("a read-only workspace shows the read-only message and changes nothing (AC-05.8)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        await startRename(page, "projects");

        await page.getByRole("textbox", { name: "Name" }).fill("Work");
        await page.keyboard.press("Enter");

        await expect(
            page
                .getByRole("dialog", { name: "Rename folder" })
                .getByText(
                    "The workspace folder is read-only. Nothing was changed.",
                ),
        ).toBeVisible();
        expect(await listDirectories(page)).toContain("projects");
    });
});

test.describe("delete a folder (AC-05.3, AC-05.4)", () => {
    test("asks once, says everything inside goes to the trash and closes the tabs inside", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();
        await row(page, "Roadmap").click();
        await openMenuOn(page, "projects");
        await menuItem(page, "Delete").click();

        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toHaveAccessibleName('Delete "projects"?');
        await expect(dialog).toContainText(
            "The folder and everything in it are moved to the trash.",
        );
        await dialog.getByRole("button", { name: "Delete" }).click();

        await expect(page.getByRole("alertdialog")).toHaveCount(0);
        expect(await listFiles(page)).toEqual(["Ideas.md", "archive/Old.md"]);
        await expect(page.getByRole("tab")).toHaveCount(0);
        await expect(row(page, "projects")).toHaveCount(0);
    });

    test("Cancel keeps the folder", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "keep/a.md": "",
            "b.md": "",
        });
        await openMenuOn(page, "keep");
        await menuItem(page, "Delete").click();

        await expect(page.getByRole("alertdialog")).toBeVisible();
        await page
            .getByRole("alertdialog")
            .getByRole("button", { name: "Cancel" })
            .click();

        expect(await listDirectories(page)).toContain("keep");
    });

    test("a read-only workspace keeps the folder and shows an error (AC-05.8)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await page.evaluate(() => {
            window.__basaltTestFs?.setReadOnly(true);
        });
        await openMenuOn(page, "archive");
        await menuItem(page, "Delete").click();
        await page
            .getByRole("alertdialog")
            .getByRole("button", { name: "Delete" })
            .click();

        await expect(
            page.getByText("The workspace folder is read-only", {
                exact: false,
            }),
        ).toBeVisible();
        await setReadOnly(page, false);
        expect(await listDirectories(page)).toContain("archive");
    });
});

test.describe("move a folder (AC-05.2, AC-05.7)", () => {
    test("dragging a folder onto another folder moves it, rewrites links, follows tabs and focuses it", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();
        await row(page, "2026").click();
        await row(page, "Plan").click();
        await expect(page.getByRole("tab")).toHaveText(["Plan"]);

        await dragFolderOnto(page, "2026", "archive");

        await expect
            .poll(() => listFiles(page))
            .toContain("archive/2026/Plan.md");
        expect(await listFiles(page)).not.toContain("projects/2026/Plan.md");
        await expect(page.getByRole("tab")).toHaveText(["Plan"]);
        expect(await readSavedText(page, "archive/2026/Plan.md")).toBe(
            "[side](../../projects/Roadmap.md)",
        );
        await expect(row(page, "archive")).toHaveAttribute(
            "aria-expanded",
            "true",
        );
        await expect(row(page, "2026")).toHaveAttribute("tabindex", "0");
    });

    test("dropping a folder into itself or a descendant changes nothing", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES);
        await row(page, "projects").click();

        await dragFolderOnto(page, "projects", "2026");
        await dragFolderOnto(page, "projects", "projects");

        expect(await listFiles(page)).toContain("projects/2026/Plan.md");
        expect(await listDirectories(page)).not.toContain(
            "projects/2026/projects",
        );
    });

    test("a collision is reported and the folder stays", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a/x/n.md": "n",
            "b/X/m.md": "m",
        });
        await row(page, "a").click();

        await dragFolderOnto(page, "x", "b");

        await expect(
            page
                .getByRole("region", { name: /Notifications/ })
                .getByText("already exists in the destination"),
        ).toBeVisible();
        expect(await listFiles(page)).toContain("a/x/n.md");
    });

    test("a read-only workspace shows the read-only message and changes nothing (AC-05.8)", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", FILES, { readOnly: true });
        await row(page, "projects").click();

        await dragFolderOnto(page, "2026", "archive");

        await expect(
            page.getByText("The workspace folder is read-only", {
                exact: false,
            }),
        ).toBeVisible();
        expect(await listFiles(page)).toContain("projects/2026/Plan.md");
    });
});
