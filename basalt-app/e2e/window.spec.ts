import { expect, test } from "@playwright/test";
import { openWorkspaceWith } from "./support";

test.describe("custom window title bar", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test(
        "shows a title bar without title text and with Minimize, Maximize and Close window buttons when the app starts",
        { tag: "@WINDOW-001" },
        async ({ page }) => {
            const bar = page.getByRole("banner", { name: "Window title bar" });

            await expect(bar).toBeVisible();
            await expect(bar.getByText("Basalt")).toHaveCount(0);
            await expect(
                bar.getByRole("button", { name: "Minimize window" }),
            ).toBeVisible();
            await expect(
                bar.getByRole("button", { name: "Maximize window" }),
            ).toBeVisible();
            await expect(
                bar.getByRole("button", { name: "Close window" }),
            ).toBeVisible();
        },
    );

    test(
        "marks the title bar as a drag region and its Close button as not draggable",
        { tag: "@WINDOW-002" },
        async ({ page }) => {
            const bar = page.getByRole("banner", { name: "Window title bar" });

            await expect(bar).toHaveAttribute("data-tauri-drag-region", "true");
            await expect(
                bar.getByRole("button", { name: "Close window" }),
            ).not.toHaveAttribute("data-tauri-drag-region");
        },
    );

    test(
        "fills the viewport height with the title bar at the top and no page scrolling while the Welcome action stays enabled",
        { tag: "@WINDOW-003" },
        async ({ page }) => {
            const bar = page.getByRole("banner", { name: "Window title bar" });

            await expect(bar).toBeVisible();
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
        },
    );

    test(
        "keeps the Welcome screen displayed when the window buttons are clicked on the memory platform",
        { tag: "@WINDOW-004" },
        async ({ page }) => {
            const bar = page.getByRole("banner", { name: "Window title bar" });

            await bar.getByRole("button", { name: "Minimize window" }).click();
            await bar.getByRole("button", { name: "Maximize window" }).click();
            await bar.getByRole("button", { name: "Close window" }).click();

            await expect(
                page.getByRole("heading", { level: 1, name: /what matters/ }),
            ).toBeVisible();
        },
    );

    test(
        "places the New note button right after the last tab and between the sidebar toggle and the window buttons when two notes are created",
        { tag: "@WINDOW-005" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/notes", {
                "a.md": "",
                "b.md": "",
            });
            const bar = page.getByRole("banner", { name: "Window title bar" });
            await bar.getByRole("button", { name: "New note" }).click();
            await bar.getByRole("button", { name: "New note" }).click();

            const tabs = bar.getByRole("tab");
            await expect(tabs).toHaveCount(2);
            await expect(bar.getByText("Basalt")).toHaveCount(0);
            const last = await tabs.last().boundingBox();
            const plus = await bar
                .getByRole("button", { name: "New note" })
                .boundingBox();
            const toggle = await bar
                .getByRole("button", { name: "Toggle sidebar" })
                .boundingBox();
            const close = await bar
                .getByRole("button", { name: "Close window" })
                .boundingBox();
            if (!last || !plus || !toggle || !close)
                throw new Error("no boxes");
            expect(toggle.x).toBeLessThan(last.x);
            expect(plus.x - (last.x + last.width)).toBeLessThan(48);
            expect(plus.x + plus.width).toBeLessThan(close.x - 200);
        },
    );
});
