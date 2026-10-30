import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePlus } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { Button } from "./Button";

const variants = ["primary", "secondary", "ghost", "destructive"] as const;

const meta = {
    title: "Primitives/Button",
    component: Button,
    tags: ["!autodocs"],
    args: { children: "Save note", onClick: fn() },
    argTypes: {
        variant: { control: "inline-radio", options: variants },
        size: { control: "inline-radio", options: ["default", "lg"] },
        disabled: { control: "boolean" },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    args: { variant: "primary" },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Save note" }));
        await expect(args.onClick).toHaveBeenCalledTimes(1);
        await userEvent.keyboard("{Enter}");
        await expect(args.onClick).toHaveBeenCalledTimes(2);
    },
};

export const Variants: Story = {
    render: (args) => (
        <div className="flex flex-wrap items-center gap-between-groups">
            <Button {...args} variant="primary">Save note</Button>
            <Button {...args} variant="secondary">Choose folder</Button>
            <Button {...args} variant="ghost">Cancel</Button>
            <Button {...args} variant="destructive">Delete note</Button>
        </div>
    ),
};

export const WithIcon: Story = {
    render: (args) => (
        <Button {...args} variant="secondary">
            <FilePlus aria-hidden="true" />
            New note
        </Button>
    ),
};

export const Sizes: Story = {
    render: (args) => (
        <div className="flex flex-wrap items-center gap-between-groups">
            <Button {...args}>Default 28 px</Button>
            <Button {...args} size="lg">Large 36 px</Button>
        </div>
    ),
};

export const States: Story = {
    parameters: { layout: "fullscreen" },
    render: (args) => (
        <StateMatrix
            columns={[...variants]}
            rows={[
                { label: "Default" },
                { label: "Hover", previewState: "hover" },
                { label: "Focus", previewState: "focus" },
                { label: "Disabled" },
            ]}
            cell={(column, row) => (
                <Button
                    {...args}
                    variant={column as (typeof variants)[number]}
                    disabled={row.label === "Disabled"}
                >
                    {column === "destructive" ? "Delete note" : "Save note"}
                </Button>
            )}
        />
    ),
};

export const LongLabel: Story = {
    parameters: { layout: "padded" },
    render: (args) => (
        <div className="max-w-prose">
            <Button {...args} variant="secondary" className="max-w-full overflow-hidden text-ellipsis">
                Choose a workspace folder on an external drive
            </Button>
        </div>
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: (args) => (
        <div className="flex w-full flex-col gap-between-groups p-panel">
            <Button {...args} className="w-full">Choose a workspace</Button>
            <Button {...args} variant="secondary" className="w-full">Create new workspace</Button>
        </div>
    ),
};

export const Disabled: Story = {
    args: { disabled: true },
    play: async ({ args, canvasElement }) => {
        const button = within(canvasElement).getByRole("button", { name: "Save note" });
        await userEvent.click(button, { pointerEventsCheck: 0 });
        await expect(button).toBeDisabled();
        await expect(args.onClick).not.toHaveBeenCalled();
    },
};
