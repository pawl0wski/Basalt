import { expect, test, type Page } from "@playwright/test";
import {
    externalDelete,
    openWorkspaceWith,
    readSavedBytes,
    readSavedText,
} from "./support";

const encoder = new TextEncoder();

function option(page: Page, name: string) {
    return page
        .getByRole("listbox", { name: "Notes" })
        .getByRole("option", { name, exact: true });
}

function editor(page: Page, name: string) {
    return page.getByRole("textbox", { name });
}

function saveState(page: Page) {
    return page.locator(".bs-save-status");
}

test.describe("choosing a workspace lists Markdown files", () => {
    test("lists nested Markdown files and hides every other file type", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/Mixed", {
            "b.md": "",
            "a.md": "",
            "docs/deep/c.md": "",
            "docs/readme.txt": "x",
            "photo.png": "x",
            "notes.md.bak": "x",
            ".hidden.md": "",
        });

        await expect(
            page.getByRole("listbox", { name: "Notes" }).getByRole("option"),
        ).toHaveText(["a", "b", "docs/deep/c"]);
    });
});

test.describe("create, edit and save", () => {
    test("a new note is typed, saved, and still has the exact bytes after a reload", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "x" });

        await page.getByRole("banner").getByRole("button", { name: "New note" }).click();
        await expect(editor(page, "Untitled")).toBeFocused();
        await page.keyboard.type("# Heading\n\nbody text");
        await expect(saveState(page)).toHaveText("Saved", { timeout: 5000 });

        expect(await readSavedBytes(page, "Untitled.md")).toEqual(
            Array.from(encoder.encode("# Heading\n\nbody text")),
        );
        expect(await readSavedText(page, "a.md")).toBe("x");

        await page.reload();

        await expect(option(page, "Untitled")).toBeVisible();
        await expect(editor(page, "Untitled")).toContainText("# Heading");
        await expect(editor(page, "Untitled")).toContainText("body text");
        expect(await readSavedBytes(page, "Untitled.md")).toEqual(
            Array.from(encoder.encode("# Heading\n\nbody text")),
        );
    });

    test("a CRLF note with a BOM keeps both, byte for byte, when edited in the app", async ({
        page,
    }) => {
        const bom = [0xef, 0xbb, 0xbf];
        const original = Uint8Array.from([
            ...bom,
            ...encoder.encode("one\r\ntwo\r\n"),
        ]);
        await openWorkspaceWith(page, "/work/W", { "a.md": original });
        await option(page, "a").click();
        await expect(editor(page, "a")).toContainText("one");

        await editor(page, "a").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type("three");
        await expect(saveState(page)).toHaveText("Not saved");
        await expect(saveState(page)).toHaveText("Saved", { timeout: 5000 });

        expect(await readSavedBytes(page, "a.md")).toEqual([
            ...bom,
            ...encoder.encode("one\r\ntwo\r\nthree"),
        ]);

        await page.reload();
        await expect(editor(page, "a")).toContainText("three");
        expect(await readSavedBytes(page, "a.md")).toEqual([
            ...bom,
            ...encoder.encode("one\r\ntwo\r\nthree"),
        ]);
    });

    test("an untouched note is never rewritten when opened", async ({
        page,
    }) => {
        const original = Uint8Array.from([
            0xef,
            0xbb,
            0xbf,
            ...encoder.encode("a\r\nb"),
        ]);
        await openWorkspaceWith(page, "/work/W", { "a.md": original });

        await option(page, "a").click();
        await expect(editor(page, "a")).toContainText("a");
        await page.keyboard.press("Control+s");
        await page.waitForTimeout(1000);

        expect(await readSavedBytes(page, "a.md")).toEqual(
            Array.from(original),
        );
    });
});

test.describe("workspace that is not writable", () => {
    test("typing shows the read-only error, keeps the text, and the file stays unchanged", async ({
        page,
    }) => {
        await openWorkspaceWith(
            page,
            "/work/RO",
            { "a.md": "base" },
            { readOnly: true },
        );
        await option(page, "a").click();
        await editor(page, "a").click();
        await page.keyboard.press("Control+End");
        await page.keyboard.type(" unsaved");

        await expect(page.getByRole("alert")).toContainText(
            "The workspace folder is read-only. Nothing was changed.",
            { timeout: 5000 },
        );
        await expect(editor(page, "a")).toContainText("base unsaved");
        await expect(saveState(page)).toHaveText("Not saved");
        await expect(
            page.getByRole("tab", { name: "a not saved" }),
        ).toBeVisible();
        expect(await readSavedText(page, "a.md")).toBe("base");
    });
});

test.describe("restoring tabs per workspace", () => {
    test("each workspace restores its own tabs and drops missing notes", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/One", {
            "a.md": "A",
            "b.md": "B",
            "gone.md": "G",
        });
        await option(page, "a").click();
        await option(page, "gone").click();
        await option(page, "b").click();
        await page.evaluate(() => {
            window.__basaltTestFs?.seedWorkspace("/work/Two", {
                "z.md": "Z",
                "y.md": "Y",
            });
            window.__basaltTestFs?.setPickerResult("/work/Two");
        });
        await page.keyboard.press("Control+o");
        await expect(page.getByText("Two", { exact: true })).toBeVisible();
        await expect(page.getByRole("tab")).toHaveCount(0);
        await option(page, "y").click();
        await expect(page.getByRole("tab")).toHaveText(["y"]);

        await page.evaluate(() => {
            window.__basaltTestFs?.setPickerResult("/work/One");
        });
        await page.keyboard.press("Control+o");
        await expect(page.getByRole("tab")).toHaveText(["a", "gone", "b"]);
        await externalDelete(page, "gone.md");
        await page.reload();

        await expect(page.getByText("One", { exact: true })).toBeVisible();
        await expect(page.getByRole("tab")).toHaveText(["a", "b"]);
        await expect(page.getByRole("tab", { name: /^b/ })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        await expect(editor(page, "b")).toContainText("B");

        await page.evaluate(() => {
            window.__basaltTestFs?.setPickerResult("/work/Two");
        });
        await page.keyboard.press("Control+o");
        await expect(page.getByRole("tab")).toHaveText(["y"]);
    });
});
