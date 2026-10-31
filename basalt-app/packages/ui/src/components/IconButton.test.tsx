import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
    it("is named by its aria-label", () => {
        render(
            <IconButton aria-label="Open settings">
                <Settings aria-hidden="true" />
            </IconButton>,
        );

        const button = screen.getByRole("button", { name: "Open settings" });
        expect(button.hasAttribute("title")).toBe(false);
    });

    it("shows its name as a tooltip on keyboard focus", async () => {
        const user = userEvent.setup();

        render(
            <IconButton aria-label="Open settings">
                <Settings aria-hidden="true" />
            </IconButton>,
        );
        await user.tab();

        expect((await screen.findByRole("tooltip")).textContent).toBe(
            "Open settings",
        );
    });

    it("lets a more specific tooltip replace the default text", async () => {
        const user = userEvent.setup();

        render(
            <IconButton aria-label="Open settings" tooltip="Settings (Ctrl+,)">
                <Settings aria-hidden="true" />
            </IconButton>,
        );
        await user.tab();

        expect((await screen.findByRole("tooltip")).textContent).toBe(
            "Settings (Ctrl+,)",
        );
        expect(
            screen.getByRole("button", { name: "Open settings" }),
        ).toBeTruthy();
    });

    it("has no tooltip when it is turned off", async () => {
        const user = userEvent.setup();

        render(
            <IconButton aria-label="Close" tooltip={false}>
                <Settings aria-hidden="true" />
            </IconButton>,
        );
        await user.tab();

        expect(screen.queryByRole("tooltip")).toBeNull();
    });

    it("activates from the keyboard and not while disabled", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        const { rerender } = render(
            <IconButton aria-label="Open settings" onClick={onClick}>
                <Settings aria-hidden="true" />
            </IconButton>,
        );
        await user.tab();
        await user.keyboard(" ");
        expect(onClick).toHaveBeenCalledOnce();

        rerender(
            <IconButton aria-label="Open settings" onClick={onClick} disabled>
                <Settings aria-hidden="true" />
            </IconButton>,
        );
        await user.click(screen.getByRole("button", { name: "Open settings" }));
        expect(onClick).toHaveBeenCalledOnce();
    });
});

describe("IconButton size and active state", () => {
    it("uses the activity button and icon tokens for the activity size", () => {
        render(
            <IconButton aria-label="Notes" size="activity">
                <Settings aria-hidden="true" />
            </IconButton>,
        );

        const className = screen.getByRole("button", {
            name: "Notes",
        }).className;
        expect(className).toContain("size-activity-button");
        expect(className).toContain("[&_svg]:size-activity-icon");
        expect(className).not.toContain("size-icon-button");
    });

    it("keeps the default size when no size is given", () => {
        render(
            <IconButton aria-label="Notes">
                <Settings aria-hidden="true" />
            </IconButton>,
        );

        const className = screen.getByRole("button", {
            name: "Notes",
        }).className;
        expect(className).toContain("size-icon-button");
        expect(className).not.toContain("size-activity-button");
    });

    it("marks the button active without changing its accessible state", () => {
        const { rerender } = render(
            <IconButton aria-label="Notes">
                <Settings aria-hidden="true" />
            </IconButton>,
        );
        const button = screen.getByRole("button", { name: "Notes" });
        expect(button.hasAttribute("data-active")).toBe(false);

        rerender(
            <IconButton aria-label="Notes" active>
                <Settings aria-hidden="true" />
            </IconButton>,
        );

        expect(button.hasAttribute("data-active")).toBe(true);
        expect(button.hasAttribute("aria-current")).toBe(false);
    });
});
