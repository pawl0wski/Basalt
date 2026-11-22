import { expect, test, type Page } from "@playwright/test";
import {
    OPEN_FOLDER,
    SIDEBAR,
    gotoWelcome,
    openWorkspaceWith,
} from "./support";

async function seedStorage(
    page: Page,
    entries: Record<string, unknown>,
): Promise<void> {
    await page.addInitScript((data) => {
        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }, entries);
}

test.describe("opening a workspace", () => {
    test(
        "shows the folder name in the sidebar and no Welcome action when a folder is chosen in the picker",
        { tag: "@WORKSPACE-009" },
        async ({ page }) => {
            await gotoWelcome(page);
            await page.evaluate(() => {
                window.__basaltTestFs?.seedWorkspace("/work/My notes", {
                    "a.md": "# A",
                });
                window.__basaltTestFs?.setPickerResult("/work/My notes");
            });

            await page.getByRole("button", OPEN_FOLDER).click();

            await expect(
                page.getByText("My notes", { exact: true }),
            ).toBeVisible();
        },
    );

    test(
        "keeps the Welcome screen and shows no error or sidebar when the picker is cancelled",
        { tag: "@WORKSPACE-010" },
        async ({ page }) => {
            await gotoWelcome(page);
            await page.evaluate(() =>
                window.__basaltTestFs?.setPickerResult(null),
            );

            await page.getByRole("button", OPEN_FOLDER).click();

            await expect(page.getByRole("button", OPEN_FOLDER)).toBeEnabled();
            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(page.getByRole("navigation", SIDEBAR)).toHaveCount(0);
        },
    );

    test(
        "shows the could-not-be-found error and stays on Welcome when the chosen folder cannot be opened",
        { tag: "@WORKSPACE-011" },
        async ({ page }) => {
            await gotoWelcome(page);
            await page.evaluate(() =>
                window.__basaltTestFs?.setPickerResult("/not/seeded"),
            );

            await page.getByRole("button", OPEN_FOLDER).click();

            await expect(page.getByRole("alert")).toContainText(
                "The file or folder could not be found.",
            );
            await expect(page.getByRole("button", OPEN_FOLDER)).toBeEnabled();
        },
    );

    test(
        "opens the picked workspace when Ctrl+O is pressed on the Welcome screen",
        { tag: "@WORKSPACE-012" },
        async ({ page }) => {
            await gotoWelcome(page);
            await page.evaluate(() => {
                window.__basaltTestFs?.seedWorkspace("/work/Keys", {});
                window.__basaltTestFs?.setPickerResult("/work/Keys");
            });

            await page.keyboard.press("Control+O");

            await expect(page.getByText("Keys", { exact: true })).toBeVisible();
        },
    );

    test(
        "switches to the picked workspace when Ctrl+O is pressed in an open workspace",
        { tag: "@WORKSPACE-013" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/First", {});
            await expect(
                page.getByText("First", { exact: true }),
            ).toBeVisible();
            await page.evaluate(() => {
                window.__basaltTestFs?.seedWorkspace("/other", {});
                window.__basaltTestFs?.setPickerResult("/other");
            });

            await page.keyboard.press("Control+O");

            await expect(
                page.getByText("other", { exact: true }),
            ).toBeVisible();
        },
    );

    test(
        "opens the remembered workspace without the Welcome action when the app launches",
        { tag: "@WORKSPACE-014" },
        async ({ page }) => {
            await seedStorage(page, {
                "basalt.memory.workspaces": {
                    "/home/me/Restored": { entries: [] },
                },
                "basalt.memory.settings": {
                    version: 1,
                    lastWorkspace: "/home/me/Restored",
                    workspaces: {},
                },
            });

            await page.goto("/");

            await expect(
                page.getByText("Restored", { exact: true }),
            ).toBeVisible();
            await expect(page.getByRole("button", OPEN_FOLDER)).toHaveCount(0);
        },
    );

    test(
        "explains that the remembered workspace was not found and keeps the picker usable when it is missing at launch",
        { tag: "@WORKSPACE-015" },
        async ({ page }) => {
            await seedStorage(page, {
                "basalt.memory.settings": {
                    version: 1,
                    lastWorkspace: "/gone",
                    workspaces: {},
                },
            });

            await page.goto("/");

            await expect(page.getByRole("status")).toContainText(
                "Workspace not found",
            );
            await expect(page.getByRole("alert")).toHaveCount(0);
            await page.getByRole("button", OPEN_FOLDER).click();
            await expect(page.getByRole("navigation", SIDEBAR)).toBeVisible();
        },
    );

    test(
        "explains that the remembered workspace is unavailable and keeps the Open action enabled when it cannot be read at launch",
        { tag: "@WORKSPACE-016" },
        async ({ page }) => {
            await seedStorage(page, {
                "basalt.memory.workspaces": {
                    "/broken": {
                        entries: [{ kind: "directory", path: "../bad" }],
                    },
                },
                "basalt.memory.settings": {
                    version: 1,
                    lastWorkspace: "/broken",
                    workspaces: {},
                },
            });

            await page.goto("/");

            await expect(page.getByRole("status")).toContainText(
                "Workspace unavailable",
            );
            await expect(page.getByRole("alert")).toHaveCount(0);
            await expect(page.getByRole("button", OPEN_FOLDER)).toBeEnabled();
        },
    );
});
