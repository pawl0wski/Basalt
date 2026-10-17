import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
    it("renders its content as a button", () => {
        render(<Button>Save note</Button>);

        expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();
    });

    it("supports the disabled state", () => {
        render(<Button disabled>Save note</Button>);

        expect(
            screen
                .getByRole("button", { name: "Save note" })
                .hasAttribute("disabled"),
        ).toBe(true);
    });

    it("reports user interaction through its callback", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(<Button onClick={onClick}>Save note</Button>);
        await user.click(screen.getByRole("button", { name: "Save note" }));

        expect(onClick).toHaveBeenCalledOnce();
    });
});
