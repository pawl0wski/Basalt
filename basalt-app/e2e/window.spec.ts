import { expect, test } from "@playwright/test";

test.describe("custom window title bar", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("shows the Basalt title bar with minimize, maximize and close", async ({
        page,
    }) => {
        const bar = page.getByRole("banner", { name: "Window title bar" });

        await expect(bar).toBeVisible();
        await expect(bar.getByText("Basalt", { exact: true })).toBeVisible();
        await expect(
            bar.getByRole("button", { name: "Minimize window" }),
        ).toBeVisible();
        await expect(
            bar.getByRole("button", { name: "Maximize window" }),
        ).toBeVisible();
        await expect(
            bar.getByRole("button", { name: "Close window" }),
        ).toBeVisible();
    });

    test("marks the bar as a drag region but not its buttons", async ({
        page,
    }) => {
        const bar = page.getByRole("banner", { name: "Window title bar" });

        await expect(bar).toHaveAttribute("data-tauri-drag-region", "true");
        await expect(
            bar.getByRole("button", { name: "Close window" }),
        ).not.toHaveAttribute("data-tauri-drag-region");
    });

    test("fills the viewport without page scrolling and keeps the welcome screen usable", async ({
        page,
    }) => {
        const bar = page.getByRole("banner", { name: "Window title bar" });

        const metrics = await page.evaluate(() => ({
            overflowY:
                document.documentElement.scrollHeight -
                document.documentElement.clientHeight,
            height: document.querySelector(".bs-app-shell")?.clientHeight,
            viewport: window.innerHeight,
        }));
        expect(metrics.overflowY).toBe(0);
        expect(metrics.height).toBe(metrics.viewport);
        expect((await bar.boundingBox())?.y).toBe(0);
        await expect(
            page.getByRole("button", { name: "Open folder as workspace" }),
        ).toBeEnabled();
    });

    test("inert window buttons on the memory platform do not break the page", async ({
        page,
    }) => {
        const bar = page.getByRole("banner", { name: "Window title bar" });

        await bar.getByRole("button", { name: "Minimize window" }).click();
        await bar.getByRole("button", { name: "Maximize window" }).click();
        await bar.getByRole("button", { name: "Close window" }).click();

        await expect(
            page.getByRole("heading", { level: 1, name: /what matters/ }),
        ).toBeVisible();
    });
});
