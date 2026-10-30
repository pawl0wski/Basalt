import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { Field } from "./Field";
import { Select } from "./Select";

const meta = {
    title: "Primitives/Select",
    component: Select,
    tags: ["!autodocs"],
    args: {
        "aria-label": "Interface text size",
        onChange: fn(),
        children: (
            <>
                <option value="system">System default</option>
                <option value="small">Small</option>
                <option value="large">Large</option>
            </>
        ),
    },
    argTypes: { disabled: { control: "boolean" } },
    decorators: [(Story) => <div className="w-full max-w-prose"><Story /></div>],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const select = within(canvasElement).getByRole("combobox", { name: "Interface text size" });
        await userEvent.selectOptions(select, "large");
        await expect(select).toHaveValue("large");
        await expect(args.onChange).toHaveBeenCalledTimes(1);
    },
};

export const InField: Story = {
    args: { "aria-label": undefined },
    render: (args) => (
        <Field label="Interface text size" hint="Applies to menus and settings, not to notes.">
            <Select {...args} />
        </Field>
    ),
    play: async ({ canvasElement }) => {
        const select = within(canvasElement).getByLabelText("Interface text size");
        await expect(select).toHaveAccessibleDescription("Applies to menus and settings, not to notes.");
    },
};

export const WithError: Story = {
    args: { "aria-label": undefined },
    render: (args) => (
        <Field label="Interface text size" error="Choose a text size.">
            <Select {...args} />
        </Field>
    ),
};

export const States: Story = {
    parameters: { layout: "fullscreen" },
    decorators: [],
    render: (args) => (
        <StateMatrix
            columns={["Select"]}
            rows={[
                { label: "Default" },
                { label: "Focus", previewState: "focus" },
                { label: "Invalid" },
                { label: "Disabled" },
            ]}
            cell={(_column, row) => (
                <div className="w-full max-w-prose">
                    <Select
                        {...args}
                        aria-invalid={row.label === "Invalid" ? true : undefined}
                        disabled={row.label === "Disabled"}
                    />
                </div>
            )}
        />
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    decorators: [(Story) => <div className="w-full p-panel"><Story /></div>],
};
