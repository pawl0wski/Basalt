import { useRef } from "react";
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
            screen.getByRole("dialog", {
                name: "Rename note",
                description: "The file name changes too.",
            }),
        ).toBeTruthy();
    });

    it("closes with Escape and returns focus to the trigger", async () => {
        const user = userEvent.setup();

        render(
            <Dialog trigger={<Button>Rename</Button>} title="Rename note" />,
        );
        await user.click(screen.getByRole("button", { name: "Rename" }));
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Rename" }),
        );
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

        expect(
            screen.getByRole("dialog").contains(document.activeElement),
        ).toBe(true);
    });

    it("renders the footer actions", () => {
        render(
            <Dialog
                open
                title="Rename note"
                footer={<Button>Save note</Button>}
            />,
        );

        expect(screen.getByRole("button", { name: "Save note" })).toBeTruthy();
    });

    it("moves initial focus to the element the consumer chooses", () => {
        function Example() {
            const cancelRef = useRef<HTMLButtonElement>(null);

            return (
                <Dialog
                    open
                    title="Delete note"
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        cancelRef.current?.focus();
                    }}
                    footer={
                        <>
                            <Button ref={cancelRef} variant="ghost">
                                Cancel
                            </Button>
                            <Button>Delete note</Button>
                        </>
                    }
                />
            );
        }

        render(<Example />);

        expect(document.activeElement).toBe(
            screen.getByRole("button", { name: "Cancel" }),
        );
    });

    it("closes with Escape while focus is on a footer button", async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

        render(
            <Dialog
                open
                title="Delete note"
                onOpenChange={onOpenChange}
                footer={<Button>Cancel</Button>}
            />,
        );
        screen.getByRole("button", { name: "Cancel" }).focus();
        await user.keyboard("{Escape}");

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("is an alertdialog when asked", () => {
        render(<Dialog open role="alertdialog" title="Delete note" />);

        expect(
            screen.getByRole("alertdialog", { name: "Delete note" }),
        ).toBeTruthy();
    });
});
