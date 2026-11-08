import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveFailedDialog } from "./SaveFailedDialog";

function setup(open = true) {
    const handlers = {
        onRetry: vi.fn(),
        onDiscard: vi.fn(),
        onCancel: vi.fn(),
    };
    render(
        <SaveFailedDialog
            open={open}
            title='Could not save "Plan"'
            reason="The folder is read-only."
            labels={{
                retry: "Retry",
                discard: "Discard changes",
                cancel: "Cancel",
            }}
            {...handlers}
        />,
    );
    return handlers;
}

describe("SaveFailedDialog", () => {
    it("is an alert dialog with the title, the reason and three actions", () => {
        setup();

        const dialog = screen.getByRole("alertdialog", {
            name: 'Could not save "Plan"',
        });
        expect(dialog).toHaveTextContent("The folder is read-only.");
        for (const name of ["Retry", "Discard changes", "Cancel"]) {
            expect(screen.getByRole("button", { name })).toBeInTheDocument();
        }
    });

    it("renders nothing while closed", () => {
        setup(false);

        expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("puts the initial focus on Cancel", async () => {
        setup();

        expect(
            await screen.findByRole("button", { name: "Cancel" }),
        ).toHaveFocus();
    });

    it("treats Escape as Cancel and never as Discard", async () => {
        const user = userEvent.setup();
        const handlers = setup();

        await user.keyboard("{Escape}");

        expect(handlers.onCancel).toHaveBeenCalledOnce();
        expect(handlers.onDiscard).not.toHaveBeenCalled();
        expect(handlers.onRetry).not.toHaveBeenCalled();
    });

    it("calls Retry and Discard callbacks only for their own buttons", async () => {
        const user = userEvent.setup();
        const handlers = setup();

        await user.click(screen.getByRole("button", { name: "Retry" }));
        expect(handlers.onRetry).toHaveBeenCalledOnce();
        expect(handlers.onDiscard).not.toHaveBeenCalled();

        await user.click(
            screen.getByRole("button", { name: "Discard changes" }),
        );
        expect(handlers.onDiscard).toHaveBeenCalledOnce();
        expect(handlers.onCancel).not.toHaveBeenCalled();
    });
});
