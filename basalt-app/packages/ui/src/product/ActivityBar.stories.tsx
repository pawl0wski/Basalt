import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bookmark, Files, Search, Settings } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { StateMatrix } from "../../.storybook/blocks";
import { ActivityBar } from "./ActivityBar";

const items = [
    { id: "notes", label: "Notes", icon: <Files aria-hidden="true" /> },
    { id: "search", label: "Search", icon: <Search aria-hidden="true" /> },
    {
        id: "bookmarks",
        label: "Bookmarks",
        icon: <Bookmark aria-hidden="true" />,
    },
];

const footerItems = [
    {
        id: "settings",
        label: "Settings",
        icon: <Settings aria-hidden="true" />,
    },
];

const meta = {
    title: "Product/ActivityBar",
    component: ActivityBar,
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen" },
    args: {
        items,
        footerItems,
        activeId: "notes",
        onSelect: fn(),
    },
    decorators: [
        (Story) => (
            <div className="h-sidebar border-r border-border-divider">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ActivityBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("button", { name: "Notes" }),
        ).toHaveAttribute("aria-current", "page");
        await userEvent.click(canvas.getByRole("button", { name: "Search" }));
        await userEvent.click(canvas.getByRole("button", { name: "Settings" }));
        await expect(args.onSelect).toHaveBeenNthCalledWith(1, "search");
        await expect(args.onSelect).toHaveBeenNthCalledWith(2, "settings");
    },
};

export const NothingActive: Story = {
    args: { activeId: undefined },
};

export const States: Story = {
    parameters: {
        layout: "fullscreen",
        a11y: {
            config: {
                rules: [{ id: "landmark-unique", enabled: false }],
            },
        },
    },
    render: (args) => (
        <StateMatrix
            columns={["Section"]}
            rows={[
                { label: "Default" },
                { label: "Hover", previewState: "hover" },
                { label: "Focus", previewState: "focus" },
                { label: "Active" },
            ]}
            cell={(_column, row) => (
                <ActivityBar
                    {...args}
                    items={items.slice(0, 1)}
                    footerItems={[]}
                    activeId={row.label === "Active" ? "notes" : undefined}
                    className="h-auto"
                />
            )}
        />
    ),
};
