import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "./Tabs";

const tabs = [
    { value: "general", label: "General", content: "General settings" },
    { value: "appearance", label: "Appearance", content: "Appearance settings" },
    { value: "sync", label: "Sync", content: "Sync settings" },
];

describe("Tabs", () => {
    it("shows the first tab by default and only its panel", () => {
        render(<Tabs label="Settings" tabs={tabs} />);

        expect(screen.getByRole("tablist", { name: "Settings" })).toBeTruthy();
        expect(screen.getByRole("tab", { name: "General" }).getAttribute("aria-selected")).toBe("true");
        expect(screen.getByRole("tabpanel").textContent).toBe("General settings");
    });

    it("switches the panel on click", async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();

        render(<Tabs label="Settings" tabs={tabs} onValueChange={onValueChange} />);
        await user.click(screen.getByRole("tab", { name: "Sync" }));

        expect(onValueChange).toHaveBeenCalledWith("sync");
        expect(screen.getByRole("tabpanel").textContent).toBe("Sync settings");
    });

    it("moves between tabs with the arrow keys and keeps one tab stop", async () => {
        const user = userEvent.setup();

        render(<Tabs label="Settings" tabs={tabs} />);
        await user.tab();
        expect(document.activeElement).toBe(screen.getByRole("tab", { name: "General" }));

        await user.keyboard("{ArrowRight}");
        expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Appearance" }));
        expect(screen.getByRole("tabpanel").textContent).toBe("Appearance settings");
        expect(screen.getByRole("tab", { name: "General" }).getAttribute("tabindex")).toBe("-1");
    });

    it("links each tab to its panel", () => {
        render(<Tabs label="Settings" tabs={tabs} />);

        const tab = screen.getByRole("tab", { name: "General" });
        expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(tab.id);
    });
});
