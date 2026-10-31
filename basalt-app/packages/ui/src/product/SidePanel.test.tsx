import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidePanel } from "./SidePanel";

describe("SidePanel", () => {
    it("is a landmark named by its title and shows its content", () => {
        render(
            <SidePanel title="Outline" onClose={() => {}}>
                <p>No headings found.</p>
            </SidePanel>,
        );

        const panel = screen.getByRole("complementary", { name: "Outline" });
        expect(panel.textContent).toContain("No headings found.");
    });

    it("names its actions after the panel and reports them", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const onSearch = vi.fn();

        render(
            <SidePanel title="Outline" onClose={onClose} onSearch={onSearch}>
                <p>content</p>
            </SidePanel>,
        );
        await user.click(
            screen.getByRole("button", { name: "Search Outline" }),
        );
        await user.click(screen.getByRole("button", { name: "Close Outline" }));

        expect(onSearch).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("has no search action unless one is given", () => {
        render(
            <SidePanel title="Outline" onClose={() => {}}>
                <p>content</p>
            </SidePanel>,
        );

        expect(screen.queryByRole("button", { name: /Search/ })).toBeNull();
        expect(
            screen.getByRole("button", { name: "Close Outline" }),
        ).toBeTruthy();
    });
});
