import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
    title: "Primitives/ConfirmDialog",
    component: ConfirmDialog,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        open: true,
        onOpenChange: fn(),
        onConfirm: fn(),
        title: "Delete \"Weekly plan\"?",
        description: "The file is moved to the trash and can be restored from there.",
        confirmLabel: "Delete note",
        destructive: true,
    },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(props: React.ComponentProps<typeof ConfirmDialog>) {
    const [open, setOpen] = useState(false);
    return (
        <div className="p-panel">
            <Button variant="secondary" onClick={() => setOpen(true)}>Delete note</Button>
            <ConfirmDialog {...props} open={open} onOpenChange={setOpen} />
        </div>
    );
}

export const Playground: Story = {
    render: (args) => <Controlled {...args} />,
    play: async ({ args, canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete note" }));
        const dialog = await screen.findByRole("alertdialog", { name: "Delete \"Weekly plan\"?" });
        await expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
        await userEvent.click(within(dialog).getByRole("button", { name: "Delete note" }));
        await expect(args.onConfirm).toHaveBeenCalledTimes(1);
        await expect(screen.queryByRole("alertdialog")).toBeNull();
    },
};

export const CancelIsFocused: Story = {
    play: async () => {
        const dialog = await screen.findByRole("alertdialog");
        await expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    },
};

export const EscapeDoesNotConfirm: Story = {
    play: async ({ args }) => {
        await screen.findByRole("alertdialog");
        await userEvent.keyboard("{Escape}");
        await expect(args.onOpenChange).toHaveBeenCalledWith(false);
        await expect(args.onConfirm).not.toHaveBeenCalled();
    },
};

export const NotDestructive: Story = {
    args: {
        title: "Discard unsaved changes?",
        description: "Changes made since the last save are lost.",
        confirmLabel: "Discard changes",
        destructive: false,
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
};
