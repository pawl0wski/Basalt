import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
    it("renders its content as a button", () => {
        render(<Button>Save note</Button>);

        expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();
    });

    it("does not submit a surrounding form unless asked to", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

        render(
            <form onSubmit={onSubmit}>
                <Button>Cancel</Button>
                <Button type="submit">Save note</Button>
            </form>,
        );
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onSubmit).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "Save note" }));
        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it("does not report clicks while disabled", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(
            <Button disabled onClick={onClick}>
                Save note
            </Button>,
        );
        await user.click(screen.getByRole("button", { name: "Save note" }));

        expect(onClick).not.toHaveBeenCalled();
    });

    it("reports user interaction through its callback, also from the keyboard", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(<Button onClick={onClick}>Save note</Button>);
        await user.click(screen.getByRole("button", { name: "Save note" }));
        await user.keyboard("{Enter}");

        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it("exposes the variant", () => {
        render(<Button variant="destructive">Delete note</Button>);

        expect(
            screen.getByRole("button", { name: "Delete note" }).dataset.variant,
        ).toBe("destructive");
    });

    it("styles the legacy default and outline names like primary and secondary", () => {
        render(
            <>
                <Button>Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
            </>,
        );

        const classes = (name: string) =>
            screen.getByRole("button", { name }).className;
        expect(classes("Default")).toBe(classes("Primary"));
        expect(classes("Outline")).toBe(classes("Secondary"));
    });

    it("never uses the danger color as a background", () => {
        render(<Button variant="destructive">Delete note</Button>);

        expect(
            screen.getByRole("button", { name: "Delete note" }).className,
        ).not.toMatch(/(^|\s)bg-status-danger/);
    });

    it("renders the child element when used as a slot", () => {
        render(
            <Button asChild>
                <a href="/notes">Open notes</a>
            </Button>,
        );

        const link = screen.getByRole("link", { name: "Open notes" });
        expect(link.getAttribute("href")).toBe("/notes");
        expect(link.hasAttribute("type")).toBe(false);
    });
});
