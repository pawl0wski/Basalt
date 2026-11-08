import { expect, test } from "@playwright/test";
import {
    OPEN_FOLDER,
    SIDEBAR,
    externalDelete,
    externalWrite,
    openWorkspaceWith,
} from "./support";

const NEW_NOTE = { name: "New note" };
const READ_ONLY = "The workspace folder is read-only. Nothing was changed.";

function options(page: import("@playwright/test").Page) {
    return page.getByRole("listbox", { name: "Notes" }).getByRole("option");
}

test.describe("workspace sidebar", () => {
    test("lists the demo workspace notes sorted, without non-Markdown files", async ({
        page,
    }) => {
        await page.goto("/");
        await page.getByRole("button", OPEN_FOLDER).click();

        await expect(options(page)).toHaveText([
            "Ideas",
            "projects/Roadmap",
            "Welcome",
        ]);
        await expect(page.getByText("readme")).toHaveCount(0);
        await expect(page.getByText("No note open")).toBeVisible();
    });

    test("shows the folder name and no Change workspace button", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/Basalt notes", { "a.md": "" });

        const sidebar = page.getByRole("navigation", SIDEBAR);
        await expect(sidebar.getByText("Basalt notes")).toBeVisible();
        await expect(
            page.getByRole("button", { name: /change workspace/i }),
        ).toHaveCount(0);
    });

    test("shows Create your first note for an empty workspace and creates it", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/Empty", {});

        await page
            .getByRole("button", { name: "Create your first note" })
            .click();

        await expect(options(page)).toHaveText(["Untitled"]);
    });

    test("opens a note from the list and highlights it", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "", "b.md": "" });

        await page.getByRole("option", { name: "b" }).click();

        await expect(page.getByRole("option", { name: "b" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        await expect(page.getByRole("option", { name: "a" })).toHaveAttribute(
            "aria-selected",
            "false",
        );
    });

    test("moves through the list with the arrow keys and opens with Enter", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", {
            "a.md": "",
            "b.md": "",
            "c.md": "",
        });
        await page.getByRole("option", { name: "a" }).focus();

        await page.keyboard.press("ArrowDown");
        await expect(page.getByRole("option", { name: "b" })).toBeFocused();
        await page.keyboard.press("ArrowDown");
        await expect(page.getByRole("option", { name: "c" })).toBeFocused();
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("Enter");

        await expect(page.getByRole("option", { name: "b" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
    });
});

test.describe("live changes", () => {
    test("a Markdown file added or removed outside the app updates the list", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });

        await externalWrite(page, "fresh.md", "# Fresh");
        await expect(options(page)).toHaveText(["a", "fresh"], {
            timeout: 2000,
        });

        await externalDelete(page, "a.md");
        await expect(options(page)).toHaveText(["fresh"], { timeout: 2000 });
    });

    test("a non-Markdown file does not appear in the list", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });

        await externalWrite(page, "photo.png", "x");
        await externalWrite(page, "marker.md", "");

        await expect(options(page)).toHaveText(["a", "marker"], {
            timeout: 2000,
        });
        await expect(page.getByText("photo")).toHaveCount(0);
    });

    test("without a working watcher the notice is shown and the list refreshes on focus", async ({
        page,
    }) => {
        await openWorkspaceWith(
            page,
            "/work/W",
            { "a.md": "" },
            { failWatch: true },
        );
        await expect(
            page.getByText("The list refreshes when the window is focused."),
        ).toBeVisible();

        await externalWrite(page, "late.md", "");
        await page.waitForTimeout(600);
        await expect(options(page)).toHaveText(["a"]);
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));

        await expect(options(page)).toHaveText(["a", "late"]);
    });

    test("shows no fallback notice when watching works", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });

        await expect(
            page.getByText("The list refreshes when the window is focused."),
        ).toHaveCount(0);
    });
});

test.describe("new note", () => {
    test("the button and Ctrl+N create Untitled and Untitled 1 at once", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });

        await page
            .getByRole("navigation")
            .getByRole("button", NEW_NOTE)
            .click();
        await expect(
            page.getByRole("option", { name: "Untitled" }),
        ).toBeVisible();
        await page.keyboard.press("Control+N");

        await expect(options(page)).toHaveText(["a", "Untitled", "Untitled 1"]);
        await expect(
            page.getByRole("option", { name: "Untitled 1" }),
        ).toHaveAttribute("aria-selected", "true");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        const files = await page.evaluate(
            () => window.__basaltTestFs?.listFiles() ?? [],
        );
        expect(files.sort()).toEqual(["Untitled 1.md", "Untitled.md", "a.md"]);
    });

    test("the title bar plus button creates a note and opens it in a tab", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });

        await page.getByRole("banner").getByRole("button", NEW_NOTE).click();

        await expect(options(page)).toHaveText(["a", "Untitled"]);
        await expect(
            page.getByRole("banner").getByRole("tab", { name: /Untitled/ }),
        ).toHaveAttribute("aria-selected", "true");
    });

    test("in a read-only workspace the message is shown and no entry is added", async ({
        page,
    }) => {
        await openWorkspaceWith(
            page,
            "/work/W",
            { "a.md": "" },
            { readOnly: true },
        );

        await page
            .getByRole("navigation")
            .getByRole("button", NEW_NOTE)
            .click();

        await expect(page.getByText(READ_ONLY)).toBeVisible();
        await expect(options(page)).toHaveText(["a"]);
        await page.keyboard.press("Control+N");
        await expect(options(page)).toHaveText(["a"]);
        const files = await page.evaluate(
            () => window.__basaltTestFs?.listFiles() ?? [],
        );
        expect(files).toEqual(["a.md"]);
    });
});

test.describe("sidebar collapse", () => {
    const collapse = ".app-sidebar-collapse";

    test("animates collapsing and expanding", async ({ page }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });
        const wrapper = page.locator(collapse);
        const toggle = page.getByRole("button", { name: "Toggle sidebar" });

        const duration = await wrapper.evaluate(
            (element) => getComputedStyle(element).transitionDuration,
        );
        expect(parseFloat(duration)).toBeGreaterThan(0);

        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect
            .poll(async () => (await wrapper.boundingBox())?.width)
            .toBe(0);
        await toggle.click();
        await expect
            .poll(async () => (await wrapper.boundingBox())?.width)
            .toBeGreaterThan(200);
        await expect(page.getByRole("option", { name: "a" })).toBeVisible();
    });

    test("does not animate with reduced motion", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await openWorkspaceWith(page, "/work/W", { "a.md": "" });

        const duration = await page
            .locator(collapse)
            .evaluate(
                (element) => getComputedStyle(element).transitionDuration,
            );

        expect(parseFloat(duration)).toBe(0);
        await page.getByRole("button", { name: "Toggle sidebar" }).click();
        await expect
            .poll(
                async () => (await page.locator(collapse).boundingBox())?.width,
            )
            .toBe(0);
    });
});
