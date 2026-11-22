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
    test("a long note scrolls inside the editor and the shell never scrolls", async ({
        page,
    }) => {
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
                editorScrolls: scroller.scrollHeight > scroller.clientHeight,
                pageScrolls:
                    document.documentElement.scrollHeight > window.innerHeight,
            };
        });

        expect(metrics.mainOverflow).toBe("hidden");
        expect(metrics.mainScrolls).toBe(false);
        expect(metrics.editorScrolls).toBe(true);
        expect(metrics.pageScrolls).toBe(false);

        await page.locator(".cm-content").click();
        await page.keyboard.press("Control+End");
        expect(
            await page.evaluate(
                () => (document.querySelector("main") as HTMLElement).scrollTop,
            ),
        ).toBe(0);
        expect(
            await page.evaluate(
                () =>
                    (document.querySelector(".cm-scroller") as HTMLElement)
                        .scrollTop,
            ),
        ).toBeGreaterThan(0);
    });

    test("the tree is the only scroller in the sidebar and the notice stays above it", async ({
        page,
    }) => {
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
            const scrollers = [...nav.querySelectorAll("*")].filter((el) => {
                const style = getComputedStyle(el);
                return (
                    /(auto|scroll)/.test(style.overflowY) &&
                    el.scrollHeight > el.clientHeight
                );
            });
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
                scrollbarWidth: getComputedStyle(scrollers[0]).scrollbarWidth,
            };
        });

        expect(result).toEqual({
            count: 1,
            alertInScroller: false,
            treeInScroller: true,
            scrollbarWidth: "thin",
        });
    });

    test("the editor scroller uses the thin scrollbar treatment", async ({
        page,
    }) => {
        await openWorkspaceWith(page, "/work/W", { "a.md": longText });
        await option(page, "a").click();

        await expect
            .poll(() =>
                page
                    .locator(".cm-scroller")
                    .evaluate((el) => getComputedStyle(el).scrollbarWidth),
            )
            .toBe("thin");
    });

    test("the welcome view scrolls in its own region on a short narrow window", async ({
        page,
    }) => {
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
                    document.documentElement.scrollWidth > window.innerWidth,
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
    });

    test("a narrow window with a note open has no horizontal scrolling", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 360, height: 640 });
        await openWorkspaceWith(page, "/work/W", {
            "a-very-long-note-name-that-should-truncate-instead-of-overflowing.md":
                longText,
        });

        const horizontal = await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(horizontal).toBe(false);
    });
});
