import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { SaveFailedDialog } from "./SaveFailedDialog";

const meta = {
    title: "Product/SaveFailedDialog",
    component: SaveFailedDialog,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        open: true,
        noteName: "Weekly plan",
        onRetry: fn(),
        onDiscard: fn(),
        onCancel: fn(),
    },
} satisfies Meta<typeof SaveFailedDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args }) => {
        const dialog = await screen.findByRole("alertdialog", {
            name: 'Could not save "Weekly plan"',
        });
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Retry" }),
        );
        await expect(args.onRetry).toHaveBeenCalledTimes(1);
        await expect(args.onDiscard).not.toHaveBeenCalled();
    },
};

export const WithReason: Story = {
    args: {
        reason: "The workspace folder is read-only. Your text is kept until you choose.",
    },
};

export const EscapeCancels: Story = {
    play: async ({ args }) => {
        await screen.findByRole("alertdialog");
        await userEvent.keyboard("{Escape}");
        await expect(args.onCancel).toHaveBeenCalledTimes(1);
        await expect(args.onDiscard).not.toHaveBeenCalled();
    },
};
