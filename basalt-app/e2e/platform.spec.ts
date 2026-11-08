import { expect, test } from "@playwright/test";

test("boots on the memory platform with the test handle", async ({ page }) => {
    await page.goto("/");

    await expect(
        page.getByRole("button", { name: "Open folder as workspace" }),
    ).toBeVisible();
    expect(await page.evaluate(() => "__basaltTestFs" in window)).toBe(true);
});
