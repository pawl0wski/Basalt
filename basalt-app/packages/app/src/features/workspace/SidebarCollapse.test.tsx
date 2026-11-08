import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarCollapse } from "./SidebarCollapse";

describe("SidebarCollapse", () => {
    it("keeps its content reachable while open", () => {
        render(
            <SidebarCollapse open>
                <button>inside</button>
            </SidebarCollapse>,
        );

        expect(screen.getByRole("button", { name: "inside" })).toBeVisible();
        expect(
            screen.getByRole("button", { name: "inside" }).closest("[inert]"),
        ).toBeNull();
    });

    it("hides collapsed content from keyboard and assistive technology", () => {
        const { container } = render(
            <SidebarCollapse open={false}>
                <button>inside</button>
            </SidebarCollapse>,
        );

        const wrapper = container.firstElementChild;
        expect(wrapper).toHaveAttribute("data-open", "false");
        expect(wrapper).toHaveAttribute("inert");
    });
});
