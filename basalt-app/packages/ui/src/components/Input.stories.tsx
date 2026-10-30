import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { Input } from "./Input";

const meta = {
    title: "Primitives/Input",
    component: Input,
    tags: ["!autodocs"],
    args: { "aria-label": "Note title", placeholder: "Untitled note", onChange: fn() },
    argTypes: { disabled: { control: "boolean" } },
    decorators: [(Story) => <div className="w-full max-w-prose"><Story /></div>],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const input = within(canvasElement).getByRole("textbox", { name: "Note title" });
        await userEvent.type(input, "Weekly plan");
        await expect(input).toHaveValue("Weekly plan");
        await expect(args.onChange).toHaveBeenCalledTimes(11);
    },
};

export const WithValue: Story = { args: { defaultValue: "Weekly plan" } };

export const Invalid: Story = {
    args: { "aria-invalid": true, defaultValue: "Weekly/plan" },
};

export const States: Story = {
    parameters: { layout: "fullscreen" },
    decorators: [],
    render: (args) => (
        <StateMatrix
            columns={["Empty", "With value"]}
            rows={[
                { label: "Default" },
                { label: "Focus", previewState: "focus" },
                { label: "Invalid" },
                { label: "Disabled" },
            ]}
            cell={(column, row) => (
                <div className="w-full max-w-prose">
                    <Input
                        {...args}
                        defaultValue={column === "With value" ? "Weekly plan" : undefined}
                        aria-invalid={row.label === "Invalid" ? true : undefined}
                        disabled={row.label === "Disabled"}
                    />
                </div>
            )}
        />
    ),
};

export const LongValue: Story = {
    args: {
        defaultValue:
            "Quarterly planning notes for the whole product team including the open questions",
    },
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    decorators: [(Story) => <div className="w-full p-panel"><Story /></div>],
};
