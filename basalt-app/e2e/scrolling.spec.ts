import { expect, test, type Page } from "@playwright/test";
import { gotoWelcome, openWorkspaceWith } from "./support";

function option(page: Page, name: string) {
    return page
        .getByRole("tree", { name: "Notes" })
        .getByRole("treeitem", { name, exact: true });
}

const longText = Array.from({ length: 200 }, (_, i) => `line ${i}`).join("\n");

function manyNotes(count: number): Record<string, string> {
    return Object.fromEntries(
        Array.from({ length: count }, (_, i) => [`note-${i}.md`, `n${i}`]),
    );
}

test.describe("scrolling model", () => {
    test(
        "scrolls a long note inside the editor and never scrolls the shell or the page when the cursor moves to the end of the note",
        { tag: "@WINDOW-006" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": longText });
            await option(page, "a").click();

            const metrics = await page.evaluate(() => {
                const main = document.querySelector("main") as HTMLElement;
                const scroller = document.querySelector(
                    ".cm-scroller",
                ) as HTMLElement;
                return {
                    mainOverflow: getComputedStyle(main).overflowY,
                    mainScrolls: main.scrollHeight > main.clientHeight,
                    editorScrolls:
                        scroller.scrollHeight > scroller.clientHeight,
                    pageScrolls:
                        document.documentElement.scrollHeight >
                        window.innerHeight,
                };
            });

            expect(metrics.mainOverflow).toBe("hidden");
            expect(metrics.mainScrolls).toBe(false);
            expect(metrics.editorScrolls).toBe(true);
            expect(metrics.pageScrolls).toBe(false);

            await page.getByRole("textbox", { name: "a" }).click();
            await page.keyboard.press("Control+End");
            expect(
                await page.evaluate(
                    () =>
                        (document.querySelector("main") as HTMLElement)
                            .scrollTop,
                ),
            ).toBe(0);
            expect(
                await page.evaluate(
                    () =>
                        (document.querySelector(".cm-scroller") as HTMLElement)
                            .scrollTop,
                ),
            ).toBeGreaterThan(0);
        },
    );

    test(
        "makes the tree the only scroller in the sidebar and keeps the watcher notice outside it when many notes are listed in a short window",
        { tag: "@WINDOW-007" },
        async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 500 });
            await openWorkspaceWith(page, "/work/W", manyNotes(60), {
                failWatch: true,
            });

            const sidebar = page.getByRole("navigation", { name: "Workspace" });
            const notice = sidebar.getByText(
                "The list refreshes when the window is focused.",
            );
            await expect(notice).toBeVisible();

            const result = await sidebar.evaluate((nav) => {
                const scrollers = [...nav.querySelectorAll("*")].filter(
                    (el) => {
                        const style = getComputedStyle(el);
                        return (
                            /(auto|scroll)/.test(style.overflowY) &&
                            el.scrollHeight > el.clientHeight
                        );
                    },
                );
                const alert = [...nav.querySelectorAll("*")].find(
                    (el) =>
                        el.children.length === 0 &&
                        el.textContent ===
                            "The list refreshes when the window is focused.",
                );
                return {
                    count: scrollers.length,
                    alertInScroller: scrollers.some((el) =>
                        alert ? el.contains(alert) : true,
                    ),
                    treeInScroller: scrollers.some((el) =>
                        el.querySelector('[role="tree"]'),
                    ),
                    scrollbarWidth: getComputedStyle(scrollers[0])
                        .scrollbarWidth,
                };
            });

            expect(result).toEqual({
                count: 1,
                alertInScroller: false,
                treeInScroller: true,
                scrollbarWidth: "thin",
            });
        },
    );

    test(
        "gives the editor scroller the thin scrollbar treatment when a long note is open",
        { tag: "@WINDOW-008" },
        async ({ page }) => {
            await openWorkspaceWith(page, "/work/W", { "a.md": longText });
            await option(page, "a").click();

            await expect
                .poll(() =>
                    page
                        .locator(".cm-scroller")
                        .evaluate((el) => getComputedStyle(el).scrollbarWidth),
                )
                .toBe("thin");
        },
    );

    test(
        "scrolls the Welcome view in its own focusable region and not in the shell on a short narrow window",
        { tag: "@WINDOW-009" },
        async ({ page }) => {
            await page.setViewportSize({ width: 360, height: 300 });
            await gotoWelcome(page);

            const result = await page.evaluate(() => {
                const main = document.querySelector("main") as HTMLElement;
                const root = main.firstElementChild as HTMLElement;
                return {
                    rootScrolls: root.scrollHeight > root.clientHeight,
                    rootOverflow: getComputedStyle(root).overflowY,
                    mainScrolls: main.scrollHeight > main.clientHeight,
                    horizontal:
                        document.documentElement.scrollWidth >
                        window.innerWidth,
                };
            });

            expect(result).toEqual({
                rootScrolls: true,
                rootOverflow: "auto",
                mainScrolls: false,
                horizontal: false,
            });

            await page.keyboard.press("Tab");
            await page.keyboard.press("Tab");
            const focusedScroller = await page.evaluate(() => {
                const root = (document.querySelector("main") as HTMLElement)
                    .firstElementChild;
                return root?.getAttribute("tabindex");
            });
            expect(focusedScroller).toBe("0");
        },
    );

    test(
        "shows no horizontal page scrolling when a note with a very long name is open in a 360 px wide window",
        { tag: "@WINDOW-010" },
        async ({ page }) => {
            await page.setViewportSize({ width: 360, height: 640 });
            await openWorkspaceWith(page, "/work/W", {
                "a-very-long-note-name-that-should-truncate-instead-of-overflowing.md":
                    longText,
            });

            const horizontal = await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            );
            expect(horizontal).toBe(false);
        },
    );
});
