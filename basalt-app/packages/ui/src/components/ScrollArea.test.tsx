import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "./ScrollArea";

describe("ScrollArea", () => {
    it("renders its children in a named region", () => {
        render(
            <ScrollArea label="Notes">
                <p>First note</p>
                <p>Second note</p>
            </ScrollArea>,
        );

        const region = screen.getByRole("region", { name: "Notes" });
        expect(region.contains(screen.getByText("First note"))).toBe(true);
        expect(region.contains(screen.getByText("Second note"))).toBe(true);
    });

    it("can be reached with the keyboard so it scrolls without a mouse", async () => {
        const user = userEvent.setup();

        render(
            <ScrollArea label="Notes">
                <p>First note</p>
            </ScrollArea>,
        );
        await user.tab();

        expect(document.activeElement).toBe(
            screen.getByRole("region", { name: "Notes" }),
        );
    });

    it("applies the caller class to the root", () => {
        const { container } = render(
            <ScrollArea label="Notes" className="h-sidebar">
                <p>First note</p>
            </ScrollArea>,
        );

        expect(
            container.firstElementChild?.classList.contains("h-sidebar"),
        ).toBe(true);
    });
});
