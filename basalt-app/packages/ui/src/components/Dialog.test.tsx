import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
    it("opens from its trigger with a name and a description", async () => {
        const user = userEvent.setup();

        render(
            <Dialog
                trigger={<Button>Rename</Button>}
                title="Rename note"
                description="The file name changes too."
            />,
        );
        expect(screen.queryByRole("dialog")).toBeNull();

        await user.click(screen.getByRole("button", { name: "Rename" }));

        expect(
            screen.getByRole("dialog", { name: "Rename note", description: "The file name changes too." }),
        ).toBeTruthy();
    });

    it("closes with Escape and returns focus to the trigger", async () => {
        const user = userEvent.setup();

        render(<Dialog trigger={<Button>Rename</Button>} title="Rename note" />);
        await user.click(screen.getByRole("button", { name: "Rename" }));
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Rename" }));
    });

    it("closes from the close button", async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

        render(<Dialog open title="Rename note" onOpenChange={onOpenChange} />);
        await user.click(screen.getByRole("button", { name: "Close" }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("keeps keyboard focus inside while open", async () => {
        const user = userEvent.setup();

        render(
            <Dialog
                open
                title="Rename note"
                footer={<Button>Save note</Button>}
            />,
        );
        for (let index = 0; index < 4; index += 1) await user.tab();

        expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    });

    it("renders the footer actions", () => {
        render(<Dialog open title="Rename note" footer={<Button>Save note</Button>} />);

        expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();
    });
});
