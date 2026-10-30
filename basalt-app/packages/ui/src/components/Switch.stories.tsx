import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { Switch } from "./Switch";

const meta = {
    title: "Primitives/Switch",
    component: Switch,
    tags: ["!autodocs"],
    args: { label: "Sync notes between devices", onCheckedChange: fn() },
    argTypes: { disabled: { control: "boolean" } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole("switch", {
            name: "Sync notes between devices",
        });
        await userEvent.click(toggle);
        await expect(toggle).toBeChecked();
        await userEvent.keyboard(" ");
        await expect(toggle).not.toBeChecked();
        await userEvent.click(canvas.getByText("Sync notes between devices"));
        await expect(toggle).toBeChecked();
        await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
    },
};

export const On: Story = { args: { defaultChecked: true } };

export const States: Story = {
    parameters: { layout: "fullscreen" },
    render: (args) => (
        <StateMatrix
            columns={["Off", "On"]}
            rows={[
                { label: "Default" },
                { label: "Hover", previewState: "hover" },
                { label: "Focus", previewState: "focus" },
                { label: "Disabled" },
            ]}
            cell={(column, row) => (
                <Switch
                    {...args}
                    label="Sync notes"
                    defaultChecked={column === "On"}
                    disabled={row.label === "Disabled"}
                />
            )}
        />
    ),
};

export const LongLabel: Story = {
    render: (args) => (
        <div className="w-full max-w-prose">
            <Switch
                {...args}
                label="Keep a copy of every image next to the note that uses it, even when the image is large"
            />
        </div>
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: (args) => (
        <div className="w-full p-panel">
            <Switch {...args} />
        </div>
    ),
};
