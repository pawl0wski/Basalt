import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePlus, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { Tree } from "../product/Tree";
import type { TreeNode } from "../product/Tree";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuPoint } from "./ContextMenu";

const onRename = fn();
const onDelete = fn();

const meta = {
    title: "Primitives/ContextMenu",
    component: ContextMenu,
    tags: ["!autodocs"],
    argTypes: {
        items: { control: false, table: { disable: true } },
        point: { control: false, table: { disable: true } },
    },
    parameters: { layout: "padded" },
    args: {
        label: "Note actions",
        point: { x: 120, y: 80 },
        onClose: fn(),
        items: [
            {
                label: "Rename",
                icon: <Pencil aria-hidden="true" />,
                onSelect: onRename,
            },
            {
                label: "New note",
                icon: <FilePlus aria-hidden="true" />,
                onSelect: () => {},
                disabled: true,
            },
            "separator",
            {
                label: "Delete",
                icon: <Trash2 aria-hidden="true" />,
                onSelect: onDelete,
                destructive: true,
            },
        ],
    },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenAtAPoint: Story = {
    play: async ({ args }) => {
        const menu = await screen.findByRole("menu", { name: "Note actions" });
        await expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
        await expect(
            within(menu).getByRole("menuitem", { name: "New note" }),
        ).toHaveAttribute("aria-disabled", "true");
        await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
        await expect(onDelete).toHaveBeenCalledTimes(1);
        await expect(args.onClose).toHaveBeenCalled();
    },
};

export const FolderActions: Story = {
    args: {
        label: "Folder actions",
        items: [
            {
                label: "New note",
                icon: <FilePlus aria-hidden="true" />,
                onSelect: () => {},
            },
            {
                label: "New folder",
                icon: <FolderPlus aria-hidden="true" />,
                onSelect: () => {},
            },
        ],
    },
};

const nodes: TreeNode[] = [
    {
        kind: "folder",
        id: "projects",
        name: "projects",
        expanded: true,
        children: [
            { kind: "note", id: "projects/Roadmap.md", name: "Roadmap" },
        ],
    },
    { kind: "note", id: "Ideas.md", name: "Ideas" },
];

function WithTree() {
    const [point, setPoint] = useState<ContextMenuPoint | null>(null);
    return (
        <div className="w-sidebar bg-surface-card">
            <Tree
                label="Notes"
                nodes={nodes}
                onToggleFolder={() => {}}
                onOpenNote={() => {}}
                onContextMenuRequest={(_id, at) => setPoint(at)}
            />
            <ContextMenu
                label="Note actions"
                point={point}
                onClose={() => setPoint(null)}
                items={[
                    {
                        label: "Rename",
                        icon: <Pencil aria-hidden="true" />,
                        onSelect: onRename,
                    },
                ]}
            />
        </div>
    );
}

export const FromTreeWithKeyboard: Story = {
    render: () => <WithTree />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await userEvent.keyboard("{Shift>}{F10}{/Shift}");
        await expect(
            await screen.findByRole("menu", { name: "Note actions" }),
        ).toBeVisible();
        await userEvent.keyboard("{Escape}");
        await expect(screen.queryByRole("menu")).toBeNull();
        await expect(
            canvas.getByRole("treeitem", { name: "projects" }),
        ).toBeVisible();
    },
};
