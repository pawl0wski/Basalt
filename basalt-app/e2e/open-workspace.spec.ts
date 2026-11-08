import { expect, test, type Page } from "@playwright/test";
import { OPEN_FOLDER, SIDEBAR } from "./support";

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
    test("opens the built-in demo workspace from the welcome screen", async ({
        page,
    }) => {
        await page.goto("/");

        await page.getByRole("button", OPEN_FOLDER).click();

        await expect(page.getByRole("navigation", SIDEBAR)).toBeVisible();
        await expect(page.getByText("demo", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", OPEN_FOLDER)).toHaveCount(0);
    });

    test("opens a workspace chosen through the test handle", async ({
        page,
    }) => {
        await page.goto("/");
        await page.evaluate(() => {
            window.__basaltTestFs?.seedWorkspace("/work/My notes", {
                "a.md": "# A",
            });
            window.__basaltTestFs?.setPickerResult("/work/My notes");
        });

        await page.getByRole("button", OPEN_FOLDER).click();

        await expect(page.getByText("My notes", { exact: true })).toBeVisible();
    });

    test("cancelling the picker keeps the welcome screen without an error", async ({
        page,
    }) => {
        await page.goto("/");
        await page.evaluate(() => window.__basaltTestFs?.setPickerResult(null));

        await page.getByRole("button", OPEN_FOLDER).click();

        await expect(page.getByRole("button", OPEN_FOLDER)).toBeEnabled();
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(page.getByRole("navigation", SIDEBAR)).toHaveCount(0);
    });

    test("a folder that cannot be opened shows an error and stays on welcome", async ({
        page,
    }) => {
        await page.goto("/");
        await page.evaluate(() =>
            window.__basaltTestFs?.setPickerResult("/not/seeded"),
        );

        await page.getByRole("button", OPEN_FOLDER).click();

        await expect(page.getByRole("alert")).toContainText(
            "The file or folder could not be found.",
        );
        await expect(page.getByRole("button", OPEN_FOLDER)).toBeEnabled();
    });

    test("opens the picker with Ctrl+O from welcome", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("heading", { level: 1 }).waitFor();

        await page.keyboard.press("Control+O");

        await expect(page.getByRole("navigation", SIDEBAR)).toBeVisible();
    });

    test("opens another workspace with Ctrl+O from a workspace window", async ({
        page,
    }) => {
        await page.goto("/");
        await page.getByRole("button", OPEN_FOLDER).click();
        await expect(page.getByText("demo", { exact: true })).toBeVisible();
        await page.evaluate(() => {
            window.__basaltTestFs?.seedWorkspace("/other", {});
            window.__basaltTestFs?.setPickerResult("/other");
        });

        await page.keyboard.press("Control+O");

        await expect(page.getByText("other", { exact: true })).toBeVisible();
    });

    test("restores the last workspace on launch", async ({ page }) => {
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

        await expect(page.getByText("Restored", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", OPEN_FOLDER)).toHaveCount(0);
    });

    test("explains a missing last workspace and keeps the picker usable", async ({
        page,
    }) => {
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
    });

    test("explains an unavailable last workspace", async ({ page }) => {
        await seedStorage(page, {
            "basalt.memory.workspaces": {
                "/broken": { entries: [{ kind: "directory", path: "../bad" }] },
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
    });
});
