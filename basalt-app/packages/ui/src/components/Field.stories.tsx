import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Field } from "./Field";
import { Input } from "./Input";

const meta = {
    title: "Primitives/Field",
    component: Field,
    tags: ["!autodocs"],
    args: {
        label: "Workspace name",
        hint: "Shown in the window title.",
        children: <Input placeholder="Personal notes" />,
    },
    decorators: [(Story) => <div className="w-full max-w-prose"><Story /></div>],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByLabelText("Workspace name");
        await expect(input).toHaveAccessibleDescription("Shown in the window title.");
        await userEvent.type(input, "Personal notes");
        await expect(input).toHaveValue("Personal notes");
    },
};

export const Required: Story = { args: { required: true } };

export const Optional: Story = {
    args: { label: "Description", optional: true, hint: undefined },
};

export const WithError: Story = {
    args: { error: "Enter a name for the workspace." },
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByLabelText("Workspace name");
        await expect(input).toBeInvalid();
        await expect(input).toHaveAccessibleDescription(
            "Shown in the window title. Enter a name for the workspace.",
        );
    },
};

function ValidatedField() {
    const [value, setValue] = useState("");
    const [touched, setTouched] = useState(false);
    const error = touched && value.trim() === "" ? "Enter a name for the workspace." : undefined;

    return (
        <Field label="Workspace name" required error={error}>
            <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onBlur={() => setTouched(true)}
            />
        </Field>
    );
}

export const ValidatesOnBlur: Story = {
    render: () => <ValidatedField />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByLabelText("Workspace name");
        await expect(input).toBeValid();
        await userEvent.click(input);
        await userEvent.tab();
        await expect(input).toBeInvalid();
        await expect(canvas.getByText("Enter a name for the workspace.")).toBeVisible();
        await userEvent.type(input, "Personal notes");
        await expect(input).toBeValid();
    },
};

export const LongText: Story = {
    args: {
        label: "Folder that holds your notes and attachments",
        hint: "Choose a folder you already back up. Basalt never moves files out of it.",
        error: "This folder is read-only. Choose a folder you can write to.",
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    decorators: [(Story) => <div className="w-full p-panel"><Story /></div>],
    args: { error: "Enter a name for the workspace." },
};
