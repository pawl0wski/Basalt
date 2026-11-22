import { expect, test, type Page } from "@playwright/test";
import { openWorkspaceWith, readSavedBytes, readSavedText } from "./support";

const PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const PNG = Uint8Array.from(Buffer.from(PNG_BASE64, "base64"));

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
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
    test(
        "shows the linked image with its alt text and hides the link source off the cursor line, then shows the source on the cursor line without changing the file",
        { tag: "@IMAGES-001" },
        async ({ page }) => {
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
        },
    );

    test(
        "shows the image when a note in a sub-folder links it relative to itself",
        { tag: "@IMAGES-002" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "Projects/Plan.md": "\n![p](../attachments/pic.png)",
                "attachments/pic.png": PNG,
            });

            await option(page, "Projects").click();
            await option(page, "Plan").click();

            await expect(image(page)).toHaveCount(1);
        },
    );

    test(
        "shows the image-not-found placeholder and leaves the note bytes unchanged when the linked image is missing",
        { tag: "@IMAGES-003" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": NOTE });

            await option(page, "a").click();

            await expect(
                page.getByText("Image not found: attachments/pic.png"),
            ).toBeVisible();
            await expect(image(page)).toHaveCount(0);
            expect(await readSavedText(page, "a.md")).toBe(NOTE);
            expect(
                Array.from((await readSavedBytes(page, "a.md")) ?? []),
            ).toEqual(Array.from(new TextEncoder().encode(NOTE)));
        },
    );

    test(
        "switches the image to the not-found placeholder when it is deleted outside the app and back to the image when it returns",
        { tag: "@IMAGES-004" },
        async ({ page }) => {
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
        },
    );

    test(
        "shows the remote-images-not-loaded placeholder and sends no request when a note links an https image",
        { tag: "@IMAGES-005" },
        async ({ page }) => {
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
        },
    );

    test(
        "shows the format-not-supported placeholder when the linked file is not an image",
        { tag: "@IMAGES-006" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "\n![x](attachments/fake.png)",
                "attachments/fake.png": "plain text",
            });

            await option(page, "a").click();

            await expect(page.getByText("Format not supported")).toBeVisible();
        },
    );

    test(
        "shows the image-not-found placeholder for the link as written when it omits the attachments folder",
        { tag: "@IMAGES-007" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "\n![x](pic.png)",
                "attachments/pic.png": PNG,
            });

            await option(page, "a").click();

            await expect(
                page.getByText("Image not found: pic.png"),
            ).toBeVisible();
        },
    );
});
