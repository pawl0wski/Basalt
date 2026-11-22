import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    freezeClock,
    installClock,
    openWorkspaceWith,
    readSavedText,
    setReadOnly,
} from "./support";

const PNG = Uint8Array.from(
    Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAHgAAAA8CAIAAAAiz+n/AAAAhklEQVR4nO3QAQkAIADAMKMZzWhGs4XCHTzA2Zhr60Lj+cEngQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K0OfNcyd2kPkdIAAAAASUVORK5CYII=",
        "base64",
    ),
);

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

const image = (page: Page) => page.locator("img.cm-image-preview");
const handle = (page: Page) =>
    page.getByRole("slider", { name: "Resize image" });

async function open(page: Page, note: string, readOnly = false) {
    await installClock(page);
    await openWorkspaceWith(
        page,
        "/work/W",
        { "a.md": note, "pic.png": PNG },
        { readOnly },
    );
    await option(page, "a").click();
    await expect(image(page)).toHaveCount(1);
    await expect
        .poll(() =>
            image(page).evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0);
    await freezeClock(page);
}

const renderedWidth = (page: Page) =>
    image(page).evaluate((img: HTMLImageElement) =>
        Math.round(img.getBoundingClientRect().width),
    );

test.describe("resize images by dragging", () => {
    test(
        "reveals the resize handle when the caret enters the image line and hides it when the caret leaves",
        { tag: "@IMAGES-018" },
        async ({ page }) => {
            await open(page, "intro\n![pic](pic.png)\nend");
            await expect(handle(page)).toHaveCSS("opacity", "0");
            await page.locator(".cm-line").nth(1).click();
            await expect(handle(page)).toHaveCSS("opacity", "1");
            await page.keyboard.press("ArrowUp");
            await expect(handle(page)).toHaveCSS("opacity", "0");
        },
    );

    test(
        "saves the width only on the image that was resized when two images share a line",
        { tag: "@IMAGES-019" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "![first|120](pic.png) ![second|120](pic.png)",
                "pic.png": PNG,
            });
            await option(page, "a").click();
            await freezeClock(page);
            const first = image(page).and(
                page.getByRole("img", { name: "first" }),
            );
            const widget = page
                .locator(".cm-image-widget")
                .filter({ has: first });
            await widget.getByRole("slider", { name: "Resize image" }).focus();
            await page.keyboard.press("ArrowRight");

            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![first|130](pic.png) ![second|120](pic.png)");
        },
    );

    test(
        "stores the dragged width in the alt text and restores the previous width and file text when Undo is pressed",
        { tag: "@IMAGES-020" },
        async ({ page }) => {
            await open(page, "intro\n\n![pic](pic.png)\n\nend");

            const box = await handle(page).boundingBox();
            if (!box) throw new Error("no handle");
            const x = box.x + box.width / 2;
            const y = box.y + box.height / 2;
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(x + 100, y, { steps: 5 });
            await page.mouse.up();

            await expect.poll(() => renderedWidth(page)).toBeGreaterThan(200);
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toMatch(/!\[pic\|\d{2,3}\]\(pic\.png\)/);

            await page.getByRole("textbox", { name: "a" }).click();
            await page.keyboard.press("Control+z");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("intro\n\n![pic](pic.png)\n\nend");
            await expect.poll(() => renderedWidth(page)).toBe(120);
        },
    );

    test(
        "renders the image at its stored width and keeps the alt text and the file unchanged when a note with a width suffix is opened",
        { tag: "@IMAGES-021" },
        async ({ page }) => {
            await open(page, "![pic|300](pic.png)");

            await expect.poll(() => renderedWidth(page)).toBe(300);
            await expect(image(page)).toHaveAttribute("alt", "pic");
            expect(await readSavedText(page, "a.md")).toBe(
                "![pic|300](pic.png)",
            );
        },
    );

    test(
        "adjusts the stored width by 10 px, 50 px, to 40 px and to 2000 px with the arrow, Shift+arrow, Home and End keys and removes it with Delete",
        { tag: "@IMAGES-022" },
        async ({ page }) => {
            await open(page, "![pic|300](pic.png)");

            await handle(page).focus();
            await page.keyboard.press("ArrowRight");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![pic|310](pic.png)");
            await page.keyboard.press("Shift+ArrowLeft");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![pic|260](pic.png)");
            await page.keyboard.press("Home");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![pic|40](pic.png)");
            await page.keyboard.press("End");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![pic|2000](pic.png)");
            await page.keyboard.press("Delete");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![pic](pic.png)");
        },
    );

    test(
        "removes the width suffix and returns the image to its natural size when the handle is double-clicked",
        { tag: "@IMAGES-023" },
        async ({ page }) => {
            await open(page, "![pic|300](pic.png)");

            await handle(page).dblclick({ force: true });

            await advanceClock(page, AUTOSAVE_DELAY_MS);

            await expect
                .poll(() => readSavedText(page, "a.md"))
                .toBe("![pic](pic.png)");
            await expect.poll(() => renderedWidth(page)).toBe(120);
        },
    );

    test(
        "shows the placeholder without a handle and keeps the note bytes when the image with a stored width is missing",
        { tag: "@IMAGES-024" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "![gone|300](missing.png)",
            });
            await option(page, "a").click();

            await expect(
                page.getByText("Image not found: missing.png"),
            ).toBeVisible();
            await expect(handle(page)).toHaveCount(0);
            expect(await readSavedText(page, "a.md")).toBe(
                "![gone|300](missing.png)",
            );
        },
    );

    test(
        "changes the text locally and shows the could-not-save alert when an image is resized in a read-only workspace",
        { tag: "@IMAGES-025" },
        async ({ page }) => {
            await open(page, "![pic|300](pic.png)", true);

            await handle(page).focus();
            await page.keyboard.press("ArrowRight");

            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect(page.getByRole("alert")).toContainText(
                "Could not save the note",
            );
            await expect(
                page.getByRole("textbox", { name: "a" }),
            ).toContainText("pic");
            await setReadOnly(page, true);
            expect(await readSavedText(page, "a.md")).toBe(
                "![pic|300](pic.png)",
            );
        },
    );
});
