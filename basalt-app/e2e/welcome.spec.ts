import { expect, test } from "@playwright/test";

test.describe("welcome screen", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test(
        "shows the product title, the introduction heading and one enabled Open folder as workspace action and no other action",
        { tag: "@WORKSPACE-004" },
        async ({ page }) => {
            await expect(page).toHaveTitle("Basalt");
            await expect(
                page.getByRole("heading", { level: 1, name: /what matters/ }),
            ).toBeVisible();
            await expect(
                page.getByRole("button", { name: "Open folder as workspace" }),
            ).toBeEnabled();
            await expect(
                page.getByRole("main").getByRole("button"),
            ).toHaveCount(1);
            await expect(
                page.getByRole("button", { name: "Create new workspace" }),
            ).toHaveCount(0);
        },
    );

    test(
        "shows each product principle as its own headed article on the welcome screen",
        { tag: "@WORKSPACE-005" },
        async ({ page }) => {
            const principles = [
                "Plain Markdown",
                "Your workspace",
                "Private by design",
            ];

            for (const title of principles) {
                await expect(
                    page.getByRole("heading", { level: 2, name: title }),
                ).toBeVisible();
            }
            await expect(page.getByRole("article")).toHaveCount(
                principles.length,
            );
        },
    );

    test(
        "gives the Open folder as workspace button a non-transparent background when the app is loaded",
        { tag: "@WORKSPACE-006" },
        async ({ page }) => {
            const button = page.getByRole("button", {
                name: "Open folder as workspace",
            });

            await expect(button).not.toHaveCSS(
                "background-color",
                "rgba(0, 0, 0, 0)",
            );
        },
    );

    test(
        "paints the Open folder as workspace button in the design system's primary action colour",
        { tag: "@WORKSPACE-007" },
        async ({ page }) => {
            const button = page.getByRole("button", {
                name: "Open folder as workspace",
            });
            const accent = await page.evaluate(() => {
                const probe = document.createElement("div");
                probe.style.backgroundColor = "var(--bs-action-primary)";
                document.body.append(probe);
                const color = getComputedStyle(probe).backgroundColor;
                probe.remove();
                return color;
            });

            expect(accent).not.toBe("rgba(0, 0, 0, 0)");
            await expect(button).toHaveCSS("background-color", accent);
        },
    );

    test(
        "keeps the Open folder as workspace button in view and the page free of horizontal scrolling on a 360 px wide viewport",
        { tag: "@WORKSPACE-008" },
        async ({ page }) => {
            await page.setViewportSize({ width: 360, height: 740 });

            await expect(
                page.getByRole("button", { name: "Open folder as workspace" }),
            ).toBeInViewport();
            const overflow = await page.evaluate(
                () =>
                    document.documentElement.scrollWidth -
                    document.documentElement.clientWidth,
            );
            expect(overflow).toBe(0);
        },
    );
});
