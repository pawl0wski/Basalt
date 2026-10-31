import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePlus, FolderPlus, Search, Settings } from "lucide-react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { IconButton } from "./IconButton";

const variants = ["ghost", "secondary"] as const;

const meta = {
    title: "Primitives/IconButton",
    component: IconButton,
    tags: ["!autodocs"],
    args: {
        "aria-label": "Open settings",
        children: <Settings aria-hidden="true" />,
        onClick: fn(),
    },
    argTypes: {
        variant: { control: "inline-radio", options: variants },
        size: { control: "inline-radio", options: ["default", "activity"] },
        active: { control: "boolean" },
        disabled: { control: "boolean" },
    },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const button = within(canvasElement).getByRole("button", {
            name: "Open settings",
        });
        await userEvent.hover(button);
        await expect(await screen.findByRole("tooltip")).toHaveTextContent(
            "Open settings",
        );
        await userEvent.unhover(button);
        await userEvent.click(button);
        await userEvent.keyboard(" ");
        await expect(args.onClick).toHaveBeenCalledTimes(2);
    },
};

export const Variants: Story = {
    render: (args) => (
        <div className="flex items-center gap-in-group">
            <IconButton {...args} variant="ghost" aria-label="New note">
                <FilePlus aria-hidden="true" />
            </IconButton>
            <IconButton {...args} variant="ghost" aria-label="New folder">
                <FolderPlus aria-hidden="true" />
            </IconButton>
            <IconButton {...args} variant="secondary" aria-label="Search notes">
                <Search aria-hidden="true" />
            </IconButton>
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
                { label: "Active" },
                { label: "Disabled" },
            ]}
            cell={(column, row) => (
                <IconButton
                    {...args}
                    variant={column as (typeof variants)[number]}
                    active={row.label === "Active"}
                    disabled={row.label === "Disabled"}
                />
            )}
        />
    ),
};

export const ActivitySize: Story = {
    render: (args) => (
        <div className="flex items-center gap-in-group">
            <IconButton {...args} size="activity" aria-label="Notes" active>
                <Settings aria-hidden="true" />
            </IconButton>
            <IconButton {...args} size="activity" aria-label="Search">
                <Search aria-hidden="true" />
            </IconButton>
        </div>
    ),
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    render: (args) => (
        <div className="flex w-full items-center justify-end gap-in-group p-panel">
            <IconButton {...args} aria-label="New note">
                <FilePlus aria-hidden="true" />
            </IconButton>
            <IconButton {...args} aria-label="New folder">
                <FolderPlus aria-hidden="true" />
            </IconButton>
            <IconButton {...args} aria-label="Open settings">
                <Settings aria-hidden="true" />
            </IconButton>
        </div>
    ),
};
