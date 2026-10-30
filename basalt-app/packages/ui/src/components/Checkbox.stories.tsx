import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { Checkbox } from "./Checkbox";

const meta = {
    title: "Primitives/Checkbox",
    component: Checkbox,
    tags: ["!autodocs"],
    args: { label: "Show word count in the status bar", onCheckedChange: fn() },
    argTypes: { disabled: { control: "boolean" } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const checkbox = within(canvasElement).getByRole("checkbox", {
            name: "Show word count in the status bar",
        });
        await userEvent.click(checkbox);
        await expect(checkbox).toBeChecked();
        await userEvent.keyboard(" ");
        await expect(checkbox).not.toBeChecked();
        await userEvent.click(within(canvasElement).getByText("Show word count in the status bar"));
        await expect(checkbox).toBeChecked();
        await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
    },
};

export const Checked: Story = { args: { defaultChecked: true } };

export const Group: Story = {
    render: () => (
        <fieldset className="m-none flex flex-col border-none p-none">
            <legend className="mb-in-group p-none font-ui-strong text-text-ui">Status bar</legend>
            <Checkbox label="Show word count" defaultChecked />
            <Checkbox label="Show character count" />
            <Checkbox label="Show sync status" defaultChecked />
        </fieldset>
    ),
};

export const States: Story = {
    parameters: { layout: "fullscreen" },
    render: (args) => (
        <StateMatrix
            columns={["Unchecked", "Checked"]}
            rows={[
                { label: "Default" },
                { label: "Hover", previewState: "hover" },
                { label: "Focus", previewState: "focus" },
                { label: "Invalid" },
                { label: "Disabled" },
            ]}
            cell={(column, row) => (
                <Checkbox
                    {...args}
                    label="Show word count"
                    defaultChecked={column === "Checked"}
                    aria-invalid={row.label === "Invalid" ? true : undefined}
                    disabled={row.label === "Disabled"}
                />
            )}
        />
    ),
};

export const LongLabel: Story = {
    render: (args) => (
        <div className="w-full max-w-prose">
            <Checkbox
                {...args}
                label="Keep image files next to the note that uses them instead of one shared attachments folder"
            />
        </div>
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: (args) => (
        <div className="w-full p-panel">
            <Checkbox {...args} label="Show word count in the status bar" />
        </div>
    ),
};
