import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { RadioGroup } from "./RadioGroup";

const options = [
    { value: "system", label: "System default" },
    { value: "small", label: "Small", description: "Menus and settings use 12 px text." },
    { value: "large", label: "Large", disabled: true },
];

const meta = {
    title: "Primitives/RadioGroup",
    component: RadioGroup,
    tags: ["!autodocs"],
    args: { legend: "Interface text size", options, defaultValue: "system", onValueChange: fn() },
    argTypes: { disabled: { control: "boolean" } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("radiogroup", { name: "Interface text size" })).toBeVisible();
        await userEvent.click(canvas.getByText("Small"));
        await expect(args.onValueChange).toHaveBeenCalledWith("small");
        await expect(canvas.getByRole("radio", { name: /Small/ })).toBeChecked();
        await userEvent.click(canvas.getByRole("radio", { name: /Small/ }));
        await userEvent.keyboard("{ArrowUp>}");
        await waitFor(() => expect(canvas.getByRole("radio", { name: "System default" })).toBeChecked());
        await userEvent.keyboard("{/ArrowUp}");
        await userEvent.keyboard("{ArrowDown>}");
        await waitFor(() => expect(canvas.getByRole("radio", { name: /Small/ })).toBeChecked());
        await userEvent.keyboard("{/ArrowDown}");
        await userEvent.keyboard("{ArrowDown>}");
        await waitFor(() => expect(canvas.getByRole("radio", { name: "System default" })).toBeChecked());
        await userEvent.keyboard("{/ArrowDown}");
    },
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
                { label: "Disabled" },
            ]}
            cell={(column, row) => (
                <RadioGroup
                    {...args}
                    legend="Text size"
                    options={[{ value: "small", label: "Small" }]}
                    defaultValue={column === "Checked" ? "small" : undefined}
                    disabled={row.label === "Disabled"}
                />
            )}
        />
    ),
};

export const LongLabels: Story = {
    args: {
        options: [
            { value: "a", label: "Keep a copy of every image next to the note that uses it", description: "Moving the note in the file explorer moves its images too, but the workspace gets more folders." },
            { value: "b", label: "Use one shared attachments folder for the whole workspace" },
        ],
        defaultValue: "a",
    },
    decorators: [(Story) => <div className="w-full max-w-prose"><Story /></div>],
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    decorators: [(Story) => <div className="w-full p-panel"><Story /></div>],
};
