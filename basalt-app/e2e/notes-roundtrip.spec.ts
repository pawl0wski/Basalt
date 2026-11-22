import { expect, test, type Page } from "@playwright/test";
import {
    AUTOSAVE_DELAY_MS,
    advanceClock,
    externalDelete,
    freezeClock,
    installClock,
    openWorkspaceWith,
    readSavedBytes,
    readSavedText,
} from "./support";

const encoder = new TextEncoder();

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

function editor(page: Page, name: string) {
    return page.getByRole("textbox", { name });
}

function unsavedTab(page: Page) {
    return page.getByRole("tab", { name: "a not saved", exact: true });
}

function savedTab(page: Page) {
    return page.getByRole("tab", { name: "a", exact: true });
}

test.describe("choosing a workspace lists Markdown files", () => {
    test(
        "lists nested Markdown files folders-first and hides other file types, hidden files and backup files when a workspace is opened",
        { tag: "@WORKSPACE-031" },
        async ({ page }) => {
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
                page.getByRole("tree", { name: "Notes" }).getByRole("treeitem"),
            ).toHaveText(["docs", "a", "b"]);

            await page.getByRole("treeitem", { name: "docs" }).click();
            await page.getByRole("treeitem", { name: "deep" }).click();

            await expect(
                page.getByRole("tree", { name: "Notes" }).getByRole("treeitem"),
            ).toHaveText(["docs", "deep", "c", "a", "b"]);
        },
    );
});

test.describe("create, edit and save", () => {
    test(
        "saves a new note under its heading name with the exact typed bytes and shows the same text after a reload",
        { tag: "@NOTES-001" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", { "a.md": "x" });
            await freezeClock(page);

            await page
                .getByRole("banner")
                .getByRole("button", { name: "New note" })
                .click();
            await expect(editor(page, "Untitled")).toBeFocused();
            await page.keyboard.type("Heading\n\nbody text");
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect(
                page.getByRole("tab", { name: "Heading", exact: true }),
            ).toBeVisible();

            expect(await readSavedBytes(page, "Heading.md")).toEqual(
                Array.from(encoder.encode("# Heading\n\nbody text")),
            );
            expect(await readSavedText(page, "a.md")).toBe("x");

            await page.reload();

            await expect(option(page, "Heading")).toBeVisible();
            await expect(editor(page, "Heading")).toContainText("# Heading");
            await expect(editor(page, "Heading")).toContainText("body text");
            expect(await readSavedBytes(page, "Heading.md")).toEqual(
                Array.from(encoder.encode("# Heading\n\nbody text")),
            );
        },
    );

    test(
        "keeps the BOM and the CRLF line endings byte for byte when a note is edited and saved",
        { tag: "@NOTES-002" },
        async ({ page }) => {
            const bom = [0xef, 0xbb, 0xbf];
            const original = Uint8Array.from([
                ...bom,
                ...encoder.encode("one\r\ntwo\r\n"),
            ]);
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", { "a.md": original });
            await option(page, "a").click();
            await expect(editor(page, "a")).toContainText("one");
            await freezeClock(page);

            await editor(page, "a").click();
            await page.keyboard.press("Control+End");
            await page.keyboard.type("three");
            await expect(unsavedTab(page)).toBeVisible();
            await advanceClock(page, AUTOSAVE_DELAY_MS);
            await expect(savedTab(page)).toBeVisible();

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
        },
    );

    test(
        "leaves the file bytes unchanged when an untouched BOM and CRLF note is opened and saved with Ctrl+S",
        { tag: "@NOTES-003" },
        async ({ page }) => {
            const original = Uint8Array.from([
                0xef,
                0xbb,
                0xbf,
                ...encoder.encode("a\r\nb"),
            ]);
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", { "a.md": original });
            await freezeClock(page);

            await option(page, "a").click();
            await expect(editor(page, "a")).toContainText("a");
            await page.keyboard.press("Control+s");
            await advanceClock(page, AUTOSAVE_DELAY_MS * 2);

            expect(await readSavedBytes(page, "a.md")).toEqual(
                Array.from(original),
            );
        },
    );
});

test.describe("restoring tabs per workspace", () => {
    test(
        "restores each workspace's own tabs and active note and drops notes that no longer exist when workspaces are switched and the app is reloaded",
        { tag: "@TABS-010" },
        async ({ page }) => {
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
        },
    );
});
