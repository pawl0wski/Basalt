import { expect, test, type Page } from "@playwright/test";
import { openWorkspaceWith, readSavedText, setReadOnly } from "./support";

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
}

const renderedWidth = (page: Page) =>
    image(page).evaluate((img: HTMLImageElement) =>
        Math.round(img.getBoundingClientRect().width),
    );

test.describe("resize images by dragging", () => {
    test("reveals the resize handle when the caret enters the image line", async ({
        page,
    }) => {
        await open(page, "intro\n![pic](pic.png)\nend");
        await expect(handle(page)).toHaveCSS("opacity", "0");
        await page.locator(".cm-line").nth(1).click();
        await expect(handle(page)).toHaveCSS("opacity", "1");
        await page.keyboard.press("ArrowUp");
        await expect(handle(page)).toHaveCSS("opacity", "0");
    });

    test("each occurrence of an image on one line has its own saved width", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "![first|120](pic.png) ![second|120](pic.png)",
            "pic.png": PNG,
        });
        await option(page, "a").click();
        const first = image(page).and(page.getByRole("img", { name: "first" }));
        const widget = page.locator(".cm-image-widget").filter({ has: first });
        await widget.getByRole("slider", { name: "Resize image" }).focus();
        await page.keyboard.press("ArrowRight");

        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("![first|130](pic.png) ![second|120](pic.png)");
    });

    test("dragging the handle stores the width in the alt text and Undo restores it", async ({
        page,
    }) => {
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
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toMatch(/!\[pic\|\d{2,3}\]\(pic\.png\)/);

        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+z");
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("intro\n\n![pic](pic.png)\n\nend");
        await expect.poll(() => renderedWidth(page)).toBe(120);
    });

    test("a stored width is applied when the note opens and survives reopening", async ({
        page,
    }) => {
        await open(page, "![pic|300](pic.png)");

        await expect.poll(() => renderedWidth(page)).toBe(300);
        await expect(image(page)).toHaveAttribute("alt", "pic");
        expect(await readSavedText(page, "a.md")).toBe("![pic|300](pic.png)");
    });

    test("the keyboard adjusts the width and Delete resets it", async ({
        page,
    }) => {
        await open(page, "![pic|300](pic.png)");

        await handle(page).focus();
        await page.keyboard.press("ArrowRight");
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("![pic|310](pic.png)");
        await page.keyboard.press("Shift+ArrowLeft");
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("![pic|260](pic.png)");
        await page.keyboard.press("Home");
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("![pic|40](pic.png)");
        await page.keyboard.press("End");
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("![pic|2000](pic.png)");
        await page.keyboard.press("Delete");
        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("![pic](pic.png)");
    });

    test("double-clicking the handle returns the image to its natural size", async ({
        page,
    }) => {
        await open(page, "![pic|300](pic.png)");

        await handle(page).dblclick({ force: true });

        await expect
            .poll(() => readSavedText(page, "a.md"))
            .toBe("![pic](pic.png)");
        await expect.poll(() => renderedWidth(page)).toBe(120);
    });

    test("a missing image shows the placeholder, no handle and keeps the note bytes", async ({
        page,
    }) => {
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
    });

    test("in a read-only workspace the resize changes the text locally and the save fails", async ({
        page,
    }) => {
        await open(page, "![pic|300](pic.png)", true);

        await handle(page).focus();
        await page.keyboard.press("ArrowRight");

        await expect(page.getByRole("alert")).toContainText(
            "Could not save the note",
            { timeout: 5000 },
        );
        await expect(page.locator(".cm-content")).toContainText("pic");
        await setReadOnly(page, true);
        expect(await readSavedText(page, "a.md")).toBe("![pic|300](pic.png)");
    });
});
