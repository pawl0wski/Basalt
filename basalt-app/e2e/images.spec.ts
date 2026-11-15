import { expect, test, type Page } from "@playwright/test";
import { openWorkspaceWith, readSavedBytes, readSavedText } from "./support";

const PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const PNG = Uint8Array.from(Buffer.from(PNG_BASE64, "base64"));

function option(page: Page, name: string) {
    return page
        .getByRole("listbox", { name: "Notes" })
        .getByRole("option", { name, exact: true });
}

function image(page: Page) {
    return page.locator("img.cm-image-preview");
}

async function writeBytes(page: Page, path: string, bytes: Uint8Array) {
    await page.evaluate(
        ({ path, bytes }) => {
            window.__basaltTestFs?.externalWrite(path, Uint8Array.from(bytes));
        },
        { path, bytes: Array.from(bytes) },
    );
}

const NOTE = "intro\n\n![pic](attachments/pic.png)\n\nend";

test.describe("images in notes", () => {
    test("shows an image linked relative to the note and hides its source off the cursor line", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": NOTE,
            "attachments/pic.png": PNG,
        });

        await option(page, "a").click();

        await expect(image(page)).toHaveCount(1);
        await expect
            .poll(() =>
                image(page).evaluate(
                    (img: HTMLImageElement) => img.naturalWidth,
                ),
            )
            .toBeGreaterThan(0);
        await expect(image(page)).toHaveAttribute("alt", "pic");
        await expect(page.locator(".cm-line").nth(2)).toHaveText("");

        await page.keyboard.press("Control+Home");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowDown");
        await expect(page.locator(".cm-line").nth(2)).toHaveText(
            "![pic](attachments/pic.png)",
        );
        expect(await readSavedText(page, "a.md")).toBe(NOTE);
    });

    test("resolves a link from a note in a sub-folder", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", {
            "Projects/Plan.md": "\n![p](../attachments/pic.png)",
            "attachments/pic.png": PNG,
        });

        await page
            .getByRole("listbox", { name: "Notes" })
            .getByRole("option", { name: /Plan/ })
            .click();

        await expect(image(page)).toHaveCount(1);
    });

    test("a missing image shows a placeholder and leaves the note bytes unchanged", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": NOTE });

        await option(page, "a").click();

        await expect(
            page.getByText("Image not found: attachments/pic.png"),
        ).toBeVisible();
        await expect(image(page)).toHaveCount(0);
        expect(await readSavedText(page, "a.md")).toBe(NOTE);
        expect(Array.from((await readSavedBytes(page, "a.md")) ?? [])).toEqual(
            Array.from(new TextEncoder().encode(NOTE)),
        );
    });

    test("an image deleted outside the app turns into a placeholder, and back when it returns", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": NOTE,
            "attachments/pic.png": PNG,
        });
        await option(page, "a").click();
        await expect(image(page)).toHaveCount(1);

        await page.evaluate(() => {
            window.__basaltTestFs?.externalDelete("attachments/pic.png");
        });
        await expect(
            page.getByText("Image not found: attachments/pic.png"),
        ).toBeVisible();
        expect(await readSavedText(page, "a.md")).toBe(NOTE);

        await writeBytes(page, "attachments/pic.png", PNG);
        await expect(image(page)).toHaveCount(1);
        await expect(page.getByText("Image not found")).toHaveCount(0);
    });

    test("a remote image is not loaded and no request is made", async ({
        page,
    }) => {
        const requests: string[] = [];
        page.on("request", (request) => requests.push(request.url()));
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "\n![r](https://images.example.test/a.png)",
        });

        await option(page, "a").click();

        await expect(
            page.getByText("Remote images are not loaded"),
        ).toBeVisible();
        expect(
            requests.filter((url) => url.includes("images.example.test")),
        ).toEqual([]);
    });

    test("a file that is not an image shows the unsupported placeholder", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "\n![x](attachments/fake.png)",
            "attachments/fake.png": "plain text",
        });

        await option(page, "a").click();

        await expect(page.getByText("Format not supported")).toBeVisible();
    });

    test("an Obsidian-style link without the folder is not searched for", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "\n![x](pic.png)",
            "attachments/pic.png": PNG,
        });

        await option(page, "a").click();

        await expect(page.getByText("Image not found: pic.png")).toBeVisible();
    });
});
