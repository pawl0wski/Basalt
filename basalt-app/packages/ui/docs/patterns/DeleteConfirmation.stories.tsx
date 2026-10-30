import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../src/components/Button";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { ToastProvider } from "../../src/components/Toast";
import { useToast } from "../../src/components/toastContext";

type Props = { noteName: string; onDelete: () => void; onUndo: () => void };

function DeleteNote({ noteName, onDelete, onUndo }: Props) {
    const [open, setOpen] = useState(false);
    const toast = useToast();

    return (
        <div className="p-panel">
            <Button variant="secondary" onClick={() => setOpen(true)}>
                Delete note
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={`Delete "${noteName}"?`}
                description="The file is moved to the trash and can be restored from there."
                confirmLabel="Delete note"
                destructive
                onConfirm={() => {
                    onDelete();
                    toast({
                        title: "Note moved to trash",
                        description: noteName,
                        action: { label: "Undo", onClick: onUndo },
                    });
                }}
            />
        </div>
    );
}

const meta = {
    title: "Patterns/Delete confirmation",
    component: DeleteNote,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: { noteName: "Weekly plan", onDelete: fn(), onUndo: fn() },
    decorators: [(Story) => <ToastProvider><Story /></ToastProvider>],
} satisfies Meta<typeof DeleteNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmThenUndo: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete note" }));
        const dialog = await screen.findByRole("alertdialog", { name: 'Delete "Weekly plan"?' });
        await expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
        await userEvent.click(within(dialog).getByRole("button", { name: "Delete note" }));
        await expect(args.onDelete).toHaveBeenCalledTimes(1);
        await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
        await expect(args.onUndo).toHaveBeenCalledTimes(1);
    },
};

export const CancelKeepsTheNote: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete note" }));
        await userEvent.keyboard("{Enter}");
        await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
        await expect(args.onDelete).not.toHaveBeenCalled();
    },
};

export const NameInTheQuestion: Story = {
    args: { noteName: "Quarterly planning notes for the whole product team" },
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete note" }));
        await expect(await screen.findByRole("alertdialog", { name: /Quarterly planning notes/ })).toBeVisible();
    },
};
