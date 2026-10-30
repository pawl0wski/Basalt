import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
    it("is a named switch that starts off", () => {
        render(<Switch label="Sync notes" />);

        expect(
            screen
                .getByRole("switch", { name: "Sync notes" })
                .getAttribute("aria-checked"),
        ).toBe("false");
    });

    it("toggles from a click on the track, on the label and from the keyboard", async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();

        render(<Switch label="Sync notes" onCheckedChange={onCheckedChange} />);
        await user.click(screen.getByRole("switch"));
        await user.click(screen.getByText("Sync notes"));
        await user.keyboard(" ");

        expect(onCheckedChange.mock.calls).toEqual([[true], [false], [true]]);
        expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
    });

    it("follows the checked prop when controlled and only reports the request", async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();

        render(<Switch label="Sync notes" checked={false} onCheckedChange={onCheckedChange} />);
        await user.click(screen.getByRole("switch"));

        expect(onCheckedChange).toHaveBeenCalledWith(true);
        expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
    });

    it("works as a controlled component inside a parent", async () => {
        const user = userEvent.setup();
        function Parent() {
            const [on, setOn] = useState(true);
            return <Switch label="Sync notes" checked={on} onCheckedChange={setOn} />;
        }

        render(<Parent />);
        await user.click(screen.getByRole("switch"));

        expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
    });

    it("does not toggle while disabled", async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();

        render(<Switch label="Sync notes" disabled onCheckedChange={onCheckedChange} />);
        await user.click(screen.getByRole("switch"));
        await user.click(screen.getByText("Sync notes"));

        expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("does not submit a surrounding form", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

        render(
            <form onSubmit={onSubmit}>
                <Switch label="Sync notes" />
            </form>,
        );
        await user.click(screen.getByRole("switch"));

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
