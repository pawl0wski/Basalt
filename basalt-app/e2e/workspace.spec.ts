import { expect, test } from "@playwright/test";
import {
    SIDEBAR,
    WATCHER_DEBOUNCE_MS,
    advanceClock,
    externalDelete,
    externalWrite,
    freezeClock,
    installClock,
    openWorkspaceWith,
} from "./support";

const NEW_NOTE = { name: "New note" };
const READ_ONLY = "The workspace folder is read-only. Nothing was changed.";

function options(page: import("@playwright/test").Page) {
    return page.getByRole("tree", { name: "Notes" }).getByRole("treeitem");
}

test.describe("workspace sidebar", () => {
    test(
        "lists folders first and then notes sorted, without non-Markdown files or the attachments folder, and shows No note open when a workspace is opened",
        { tag: "@WORKSPACE-017" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "Welcome.md": "",
                "Ideas.md": "",
                "projects/Roadmap.md": "",
                "readme.txt": "text",
                "attachments/pic.png": Uint8Array.from([1, 2, 3]),
            });

            await expect(options(page)).toHaveText([
                "projects",
                "Ideas",
                "Welcome",
            ]);
            await expect(page.getByText("readme")).toHaveCount(0);
            await expect(page.getByText("No note open")).toBeVisible();
        },
    );

    test(
        "shows the workspace folder name in the sidebar header and offers no Change workspace button",
        { tag: "@WORKSPACE-018" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/Basalt notes", { "a.md": "" });

            const sidebar = page.getByRole("navigation", SIDEBAR);
            await expect(sidebar.getByText("Basalt notes")).toBeVisible();
            await expect(
                page.getByRole("button", { name: /change workspace/i }),
            ).toHaveCount(0);
        },
    );

    test(
        "creates an Untitled note when Create your first note is chosen in an empty workspace",
        { tag: "@WORKSPACE-019" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/Empty", {});

            await page
                .getByRole("button", { name: "Create your first note" })
                .click();

            await expect(options(page)).toHaveText(["Untitled"]);
        },
    );

    test(
        "highlights the chosen note and not the others when a note is chosen in the list",
        { tag: "@WORKSPACE-020" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "",
                "b.md": "",
            });

            await page.getByRole("treeitem", { name: "b" }).click();

            await expect(
                page.getByRole("treeitem", { name: "b" }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(
                page.getByRole("treeitem", { name: "a" }),
            ).toHaveAttribute("aria-selected", "false");
        },
    );

    test(
        "moves focus with the arrow keys and selects the focused note with Enter",
        { tag: "@WORKSPACE-021" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", {
                "a.md": "",
                "b.md": "",
                "c.md": "",
            });
            await page.getByRole("treeitem", { name: "a" }).focus();

            await page.keyboard.press("ArrowDown");
            await expect(
                page.getByRole("treeitem", { name: "b" }),
            ).toBeFocused();
            await page.keyboard.press("ArrowDown");
            await expect(
                page.getByRole("treeitem", { name: "c" }),
            ).toBeFocused();
            await page.keyboard.press("ArrowUp");
            await page.keyboard.press("Enter");

            await expect(
                page.getByRole("treeitem", { name: "b" }),
            ).toHaveAttribute("aria-selected", "true");
        },
    );
});

test.describe("live changes", () => {
    test(
        "adds and removes the list entry within the watcher debounce when a Markdown file is created or deleted outside the app",
        { tag: "@WORKSPACE-022" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", { "a.md": "" });
            await freezeClock(page);

            await externalWrite(page, "fresh.md", "# Fresh");
            await advanceClock(page, WATCHER_DEBOUNCE_MS);
            await expect(options(page)).toHaveText(["a", "fresh"]);

            await externalDelete(page, "a.md");
            await advanceClock(page, WATCHER_DEBOUNCE_MS);
            await expect(options(page)).toHaveText(["fresh"]);
        },
    );

    test(
        "leaves a non-Markdown file out of the list when it is created outside the app",
        { tag: "@WORKSPACE-023" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(page, "/work/W", { "a.md": "" });
            await freezeClock(page);

            await externalWrite(page, "photo.png", "x");
            await externalWrite(page, "marker.md", "");
            await advanceClock(page, WATCHER_DEBOUNCE_MS);

            await expect(options(page)).toHaveText(["a", "marker"]);
            await expect(page.getByText("photo")).toHaveCount(0);
        },
    );

    test(
        "shows the focus-refresh notice and updates the list only when the window is focused when the watcher cannot start",
        { tag: "@WORKSPACE-024" },
        async ({ page }) => {
            await installClock(page);
            await openWorkspaceWith(
                page,
                "/work/W",
                { "a.md": "" },
                { failWatch: true },
            );
            await freezeClock(page);
            await expect(
                page.getByText(
                    "The list refreshes when the window is focused.",
                ),
            ).toBeVisible();

            await externalWrite(page, "late.md", "");
            await advanceClock(page, WATCHER_DEBOUNCE_MS * 2);
            await expect(options(page)).toHaveText(["a"]);
            await page.evaluate(() => window.dispatchEvent(new Event("focus")));

            await expect(options(page)).toHaveText(["a", "late"]);
        },
    );

    test(
        "shows no focus-refresh notice when the watcher works",
        { tag: "@WORKSPACE-025" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "" });

            await expect(
                page.getByText(
                    "The list refreshes when the window is focused.",
                ),
            ).toHaveCount(0);
        },
    );
});

test.describe("new note", () => {
    test(
        "creates Untitled and then Untitled 1 at once without a dialog when the New note button and Ctrl+N are used",
        { tag: "@WORKSPACE-026" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "" });

            await page
                .getByRole("navigation")
                .getByRole("button", NEW_NOTE)
                .click();
            await expect(
                page.getByRole("treeitem", { name: "Untitled" }),
            ).toBeVisible();
            await page.keyboard.press("Control+N");

            await expect(options(page)).toHaveText([
                "a",
                "Untitled",
                "Untitled 1",
            ]);
            await expect(
                page.getByRole("treeitem", { name: "Untitled 1" }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(page.getByRole("dialog")).toHaveCount(0);
            const files = await page.evaluate(
                () => window.__basaltTestFs?.listFiles() ?? [],
            );
            expect(files.sort()).toEqual([
                "Untitled 1.md",
                "Untitled.md",
                "a.md",
            ]);
        },
    );

    test(
        "creates Untitled and opens it in a selected tab when the title bar New note button is used",
        { tag: "@WORKSPACE-027" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": "" });

            await page
                .getByRole("banner")
                .getByRole("button", NEW_NOTE)
                .click();

            await expect(options(page)).toHaveText(["a", "Untitled"]);
            await expect(
                page.getByRole("banner").getByRole("tab", { name: /Untitled/ }),
            ).toHaveAttribute("aria-selected", "true");
        },
    );

    test(
        "shows the read-only message and adds no note when New note or Ctrl+N is used in a read-only workspace",
        { tag: "@WORKSPACE-028" },
        async ({ page }) => {
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
        },
    );
});

test.describe("sidebar collapse", () => {
    const collapse = ".app-sidebar-collapse";

    test(
        "animates the sidebar width to zero and back when the sidebar toggle is used",
        { tag: "@WORKSPACE-029" },
        async ({ page }) => {
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
            await expect(
                page.getByRole("treeitem", { name: "a" }),
            ).toBeVisible();
        },
    );

    test(
        "collapses the sidebar without a transition when reduced motion is preferred",
        { tag: "@WORKSPACE-030" },
        async ({ page }) => {
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
                    async () =>
                        (await page.locator(collapse).boundingBox())?.width,
                )
                .toBe(0);
        },
    );
});
