import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent } from "storybook/test";
import { NewNoteDialog } from "./NewNoteDialog";

const meta = {
    title: "Product/NewNoteDialog",
    component: NewNoteDialog,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: { open: true, onOpenChange: fn(), name: "Untitled", onNameChange: fn(), onCreate: fn() },
} satisfies Meta<typeof NewNoteDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(props: React.ComponentProps<typeof NewNoteDialog>) {
    const [name, setName] = useState(props.name);
    return <NewNoteDialog {...props} name={name} onNameChange={setName} />;
}

export const Playground: Story = {
    render: (args) => <Controlled {...args} />,
    play: async ({ args }) => {
        const input = await screen.findByRole("textbox", { name: "Note name" });
        await expect(input).toHaveValue("Untitled");
        await userEvent.clear(input);
        await userEvent.type(input, "Weekly plan{Enter}");
        await expect(args.onCreate).toHaveBeenCalledTimes(1);
    },
};

export const NameAlreadyExists: Story = {
    args: { name: "Weekly plan", error: "A note named Weekly plan already exists. Choose another name." },
    play: async ({ args }) => {
        const input = await screen.findByRole("textbox", { name: "Note name" });
        await expect(input).toBeInvalid();
        await expect(screen.getByRole("button", { name: "Create note" })).toBeDisabled();
        await userEvent.type(input, "{Enter}");
        await expect(args.onCreate).not.toHaveBeenCalled();
    },
};

export const InvalidCharacters: Story = {
    args: { name: "plan/2026", error: "A note name cannot contain / \\ : * ? \" < > |." },
};

export const Creating: Story = { args: { pending: true } };
