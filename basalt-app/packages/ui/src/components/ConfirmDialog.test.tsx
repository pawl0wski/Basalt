import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

const setup = (props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
        <ConfirmDialog
            open
            onOpenChange={onOpenChange}
            title="Delete Weekly plan?"
            description="The file is moved to the trash."
            confirmLabel="Delete note"
            onConfirm={onConfirm}
            destructive
            {...props}
        />,
    );
    return { onConfirm, onOpenChange };
};

describe("ConfirmDialog", () => {
    it("is an alert dialog named by the question", () => {
        setup();

        expect(screen.getByRole("alertdialog", { name: "Delete Weekly plan?" })).toBeTruthy();
    });

    it("puts focus on the safe choice, not on the destructive one", () => {
        setup();

        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
    });

    it("confirms with the verb button and closes", async () => {
        const user = userEvent.setup();
        const { onConfirm, onOpenChange } = setup();

        await user.click(screen.getByRole("button", { name: "Delete note" }));

        expect(onConfirm).toHaveBeenCalledOnce();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("cancels without confirming", async () => {
        const user = userEvent.setup();
        const { onConfirm, onOpenChange } = setup();

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not confirm on Escape", async () => {
        const user = userEvent.setup();
        const { onConfirm } = setup();

        await user.keyboard("{Escape}");

        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("styles the confirm button as destructive only when asked", () => {
        const { rerender } = render(
            <ConfirmDialog open onOpenChange={() => {}} title="t" confirmLabel="Delete note" onConfirm={() => {}} destructive />,
        );
        expect(screen.getByRole("button", { name: "Delete note" }).dataset.variant).toBe("destructive");

        rerender(
            <ConfirmDialog open onOpenChange={() => {}} title="t" confirmLabel="Discard changes" onConfirm={() => {}} />,
        );
        expect(screen.getByRole("button", { name: "Discard changes" }).dataset.variant).toBe("primary");
    });
});
