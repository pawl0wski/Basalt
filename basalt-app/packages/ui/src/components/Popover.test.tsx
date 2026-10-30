import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Popover } from "./Popover";

describe("Popover", () => {
    it("opens from its trigger as a named dialog", async () => {
        const user = userEvent.setup();

        render(
            <Popover label="Accent color" trigger={<Button>Accent</Button>}>
                <p>Choose an accent.</p>
            </Popover>,
        );
        expect(screen.queryByRole("dialog")).toBeNull();

        await user.click(screen.getByRole("button", { name: "Accent" }));

        expect(screen.getByRole("dialog", { name: "Accent color" })).toBeTruthy();
        expect(screen.getByText("Choose an accent.")).toBeTruthy();
    });

    it("tells assistive technology whether it is expanded", async () => {
        const user = userEvent.setup();

        render(
            <Popover label="Accent color" trigger={<Button>Accent</Button>}>
                <p>Choose an accent.</p>
            </Popover>,
        );
        const trigger = screen.getByRole("button", { name: "Accent" });
        expect(trigger.getAttribute("aria-expanded")).toBe("false");

        await user.click(trigger);
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    it("closes with Escape and returns focus to the trigger", async () => {
        const user = userEvent.setup();

        render(
            <Popover label="Accent color" trigger={<Button>Accent</Button>}>
                <p>Choose an accent.</p>
            </Popover>,
        );
        await user.click(screen.getByRole("button", { name: "Accent" }));
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Accent" }));
    });
});
