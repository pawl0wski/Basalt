import { expect, test } from "@playwright/test";

test.describe("welcome screen", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("introduces the product and its workspace actions", async ({
        page,
    }) => {
        await expect(page).toHaveTitle("Basalt");
        await expect(
            page.getByRole("heading", { level: 1, name: /what matters/ }),
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Choose a workspace" }),
        ).toBeEnabled();
        await expect(
            page.getByRole("button", { name: "Create new workspace" }),
        ).toBeEnabled();
    });

    test("lists every product principle as its own section", async ({
        page,
    }) => {
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
        await expect(page.getByRole("article")).toHaveCount(principles.length);
    });

    test("applies the stylesheet", async ({ page }) => {
        const button = page.getByRole("button", { name: "Choose a workspace" });

        await expect(button).not.toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
        );
    });

    test("styles the main action with the design system accent", async ({
        page,
    }) => {
        const button = page.getByRole("button", { name: "Choose a workspace" });
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
    });

    test("stays usable without horizontal scrolling on a narrow viewport", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 360, height: 740 });

        await expect(
            page.getByRole("button", { name: "Create new workspace" }),
        ).toBeInViewport();
        const overflow = await page.evaluate(
            () =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth,
        );
        expect(overflow).toBe(0);
    });
});
