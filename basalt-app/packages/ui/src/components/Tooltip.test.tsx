import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
    it("is hidden until the trigger is focused", async () => {
        const user = userEvent.setup();

        render(
            <Tooltip content="Create a note">
                <Button>New</Button>
            </Tooltip>,
        );
        expect(screen.queryByRole("tooltip")).toBeNull();

        await user.tab();
        expect((await screen.findByRole("tooltip")).textContent).toBe("Create a note");
    });

    it("closes with Escape", async () => {
        const user = userEvent.setup();

        render(
            <Tooltip content="Create a note">
                <Button>New</Button>
            </Tooltip>,
        );
        await user.tab();
        await screen.findByRole("tooltip");
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("tooltip")).toBeNull();
    });

    it("describes the trigger", async () => {
        const user = userEvent.setup();

        render(
            <Tooltip content="Create a note">
                <Button>New</Button>
            </Tooltip>,
        );
        await user.tab();
        await screen.findByRole("tooltip");

        expect(screen.getByRole("button", { name: "New" }).getAttribute("aria-describedby")).toBeTruthy();
    });
});
