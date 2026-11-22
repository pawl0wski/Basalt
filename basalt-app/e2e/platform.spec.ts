import { expect, test } from "@playwright/test";

test(
    "starts on the memory platform with the Welcome action shown and the test file-system handle exposed",
    { tag: "@PLATFORM-001" },
    async ({ page }) => {
        await page.goto("/");

        await expect(
            page.getByRole("button", { name: "Open folder as workspace" }),
        ).toBeVisible();
        expect(await page.evaluate(() => "__basaltTestFs" in window)).toBe(
            true,
        );
    },
);
