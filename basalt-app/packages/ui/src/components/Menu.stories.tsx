import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { Button } from "./Button";
import { Menu } from "./Menu";

const onRename = fn();
const onDelete = fn();

const meta = {
    title: "Primitives/Menu",
    component: Menu,
    tags: ["!autodocs"],
    argTypes: {
        trigger: { control: false, table: { disable: true } },
        items: { control: false, table: { disable: true } },
    },
    parameters: { layout: "padded" },
    args: {
        trigger: <Button variant="secondary">Note actions</Button>,
        items: [
            {
                label: "Rename",
                icon: <Pencil aria-hidden="true" />,
                onSelect: onRename,
            },
            {
                label: "Duplicate",
                icon: <Copy aria-hidden="true" />,
                onSelect: () => {},
                disabled: true,
            },
            "separator",
            {
                label: "Delete note",
                icon: <Trash2 aria-hidden="true" />,
                onSelect: onDelete,
                destructive: true,
            },
        ],
    },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole("button", {
            name: "Note actions",
        });
        await userEvent.click(trigger);
        const menu = await screen.findByRole("menu", { name: "Note actions" });
        await expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
        await userEvent.keyboard("{ArrowDown}");
        await userEvent.keyboard("{ArrowDown}");
        await userEvent.keyboard("{Enter}");
        await expect(onDelete).toHaveBeenCalledTimes(1);
        await expect(screen.queryByRole("menu")).toBeNull();
        await expect(trigger).toHaveFocus();
    },
};

export const Open: Story = {
    args: { defaultOpen: true },
    play: async () => {
        const menu = await screen.findByRole("menu");
        await expect(
            within(menu).getByRole("menuitem", { name: "Duplicate" }),
        ).toHaveAttribute("aria-disabled", "true");
    },
};

export const AlignedToTheEnd: Story = {
    args: { defaultOpen: true, align: "end" },
    decorators: [
        (Story) => (
            <div className="flex w-full justify-end">
                <Story />
            </div>
        ),
    ],
};

export const NarrowScreen: Story = {
    globals: { viewport: { value: "mobile" } },
    args: { defaultOpen: true },
};
