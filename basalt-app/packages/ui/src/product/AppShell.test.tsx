import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
    it("places the regions in window order around the main content", () => {
        render(
            <AppShell
                titleBar={<header>title</header>}
                activityBar={<nav aria-label="activity">activity</nav>}
                sidebar={<nav aria-label="sidebar">sidebar</nav>}
                sidePanel={<aside aria-label="panel">panel</aside>}
                statusBar={<footer>status</footer>}
            >
                <p>note</p>
            </AppShell>,
        );

        const order = [
            screen.getByText("title"),
            screen.getByText("activity"),
            screen.getByText("sidebar"),
            screen.getByRole("main"),
            screen.getByText("panel"),
            screen.getByText("status"),
        ];
        for (let index = 1; index < order.length; index += 1) {
            expect(
                order[index - 1].compareDocumentPosition(order[index]) &
                    Node.DOCUMENT_POSITION_FOLLOWING,
            ).toBeTruthy();
        }
        expect(screen.getByRole("main").textContent).toBe("note");
    });

    it("draws no empty region or divider for what is left out", () => {
        const { container } = render(
            <AppShell>
                <p>note</p>
            </AppShell>,
        );

        expect(container.querySelectorAll("[class*='border-']")).toHaveLength(
            0,
        );
        expect(screen.getByRole("main").textContent).toBe("note");
    });

    it("separates every region from the main content with a divider", () => {
        const { container } = render(
            <AppShell
                titleBar={<header>title</header>}
                activityBar={<nav aria-label="activity">activity</nav>}
                sidebar={<nav aria-label="sidebar">sidebar</nav>}
                sidePanel={<aside aria-label="panel">panel</aside>}
            >
                <p>note</p>
            </AppShell>,
        );

        const dividers = [...container.querySelectorAll("[class*='border-']")];
        expect(dividers.map((node) => node.textContent)).toEqual([
            "title",
            "activity",
            "sidebar",
            "panel",
        ]);
    });

    it("never scrolls the shell: main is not a scroll owner or a tab stop", () => {
        render(
            <AppShell sidebar={<nav aria-label="sidebar">sidebar</nav>}>
                <p>note</p>
            </AppShell>,
        );

        const main = screen.getByRole("main");
        expect(main?.classList.contains("overflow-hidden")).toBe(true);
        expect(main.classList.contains("overflow-y-auto")).toBe(false);
        expect(main.hasAttribute("tabindex")).toBe(false);
    });
});
