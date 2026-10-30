import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Field } from "./Field";
import { Input } from "./Input";

const meta = {
    title: "Primitives/Dialog",
    component: Dialog,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        title: "Rename note",
        description: "The file name on disk changes too.",
        onOpenChange: fn(),
        children: (
            <Field label="Note title">
                <Input defaultValue="Weekly plan" />
            </Field>
        ),
        footer: (
            <>
                <Button variant="ghost">Cancel</Button>
                <Button>Rename note</Button>
            </>
        ),
    },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    args: { trigger: <Button variant="secondary">Rename note</Button> },
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole("button", { name: "Rename note" });
        await userEvent.click(trigger);
        const dialog = await screen.findByRole("dialog", { name: "Rename note" });
        await expect(dialog).toHaveAccessibleDescription("The file name on disk changes too.");
        await userEvent.keyboard("{Escape}");
        await expect(screen.queryByRole("dialog")).toBeNull();
        await expect(trigger).toHaveFocus();
    },
};

export const Open: Story = {
    args: { open: true },
    play: async () => {
        const dialog = await screen.findByRole("dialog", { name: "Rename note" });
        await expect(dialog).toContainElement(document.activeElement as HTMLElement);
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.tab();
        await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    },
};

export const WithoutDescription: Story = {
    args: { open: true, description: undefined },
};

export const LongContent: Story = {
    args: {
        open: true,
        title: "Move the workspace to a folder on an external drive that may not always be connected",
        description:
            "Notes and attachments are copied first and removed from the old folder only after the copy finishes. This can take a while for large workspaces.",
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    args: { open: true },
};
