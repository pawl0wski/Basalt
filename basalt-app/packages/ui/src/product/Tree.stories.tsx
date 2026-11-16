import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Tree } from "./Tree";
import type { TreeDropTarget, TreeNode, TreeProps } from "./Tree";

const initialNodes: TreeNode[] = [
    {
        kind: "folder",
        id: "projects",
        name: "projects",
        expanded: true,
        children: [
            {
                kind: "folder",
                id: "projects/2026",
                name: "2026",
                expanded: true,
                children: [
                    {
                        kind: "note",
                        id: "projects/2026/Q1.md",
                        name: "Q1 plan",
                    },
                    {
                        kind: "note",
                        id: "projects/2026/Q2.md",
                        name: "Q2 plan",
                    },
                ],
            },
            { kind: "note", id: "projects/Roadmap.md", name: "Roadmap" },
        ],
    },
    {
        kind: "folder",
        id: "archive",
        name: "archive",
        expanded: false,
        children: [{ kind: "note", id: "archive/Old.md", name: "Old note" }],
    },
    {
        kind: "folder",
        id: "empty",
        name: "empty",
        expanded: true,
        children: [],
    },
    { kind: "note", id: "Ideas.md", name: "Ideas" },
    { kind: "note", id: "Weekly plan.md", name: "Weekly plan" },
];

function toggle(list: TreeNode[], id: string): TreeNode[] {
    return list.map((node) =>
        node.kind === "folder"
            ? {
                  ...node,
                  expanded: node.id === id ? !node.expanded : node.expanded,
                  children: toggle(node.children, id),
              }
            : node,
    );
}

const meta = {
    title: "Product/Tree",
    component: Tree,
    tags: ["!autodocs"],
    parameters: { layout: "padded" },
    args: {
        label: "Notes",
        nodes: initialNodes,
        onToggleFolder: fn(),
        onOpenNote: fn(),
        onSelectionChange: fn(),
        onClearSelection: fn(),
        onContextMenuRequest: fn(),
        onDragStart: fn(),
        onDragEnd: fn(),
        onDropTargetChange: fn(),
        onDrop: fn(),
        onFolderHoverOpen: fn(),
    },
    decorators: [
        (Story) => (
            <div className="h-sidebar w-sidebar overflow-y-auto bg-surface-card">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(props: TreeProps) {
    const [nodes, setNodes] = useState(props.nodes);
    const [activeId, setActiveId] = useState(props.activeId ?? null);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    return (
        <Tree
            {...props}
            nodes={nodes}
            activeId={activeId}
            focusedId={focusedId}
            onFocusChange={setFocusedId}
            onToggleFolder={(id) => {
                setNodes((current) => toggle(current, id));
                props.onToggleFolder(id);
            }}
            onOpenNote={(id) => {
                setActiveId(id);
                props.onOpenNote(id);
            }}
        />
    );
}

export const Playground: Story = {
    render: (args) => <Controlled {...args} />,
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(
            canvas.getByRole("treeitem", { name: "projects" }),
        ).toHaveFocus();
        await userEvent.keyboard(
            "{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}",
        );
        await expect(
            canvas.getByRole("treeitem", { name: "archive" }),
        ).toHaveFocus();
        await userEvent.keyboard("{ArrowRight}");
        await expect(
            canvas.getByRole("treeitem", { name: "archive" }),
        ).toHaveAttribute("aria-expanded", "true");
        await userEvent.keyboard("{ArrowRight}{Enter}");
        await expect(args.onOpenNote).toHaveBeenCalledWith("archive/Old.md");
        await expect(
            canvas.getByRole("treeitem", { name: "Old note" }),
        ).toHaveAttribute("aria-selected", "true");
    },
};

export const Nested: Story = {
    args: { activeId: "projects/2026/Q2.md" },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("treeitem", { name: "Q2 plan" }),
        ).toHaveAttribute("aria-level", "3");
        await expect(
            canvas.getByRole("treeitem", { name: "Q2 plan" }),
        ).toHaveAttribute("aria-selected", "true");
    },
};

export const MultiSelect: Story = {
    args: {
        selectedIds: new Set(["projects/Roadmap.md", "Ideas.md"]),
        activeId: "Weekly plan.md",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getAllByRole("treeitem", { selected: true }),
        ).toHaveLength(2);
        await expect(
            canvas.getByRole("treeitem", { name: "Weekly plan" }),
        ).toHaveAttribute("aria-selected", "false");
    },
};

function DropTargetStory(props: TreeProps) {
    const [target, setTarget] = useState<TreeDropTarget | null>(
        props.dropTarget ?? null,
    );
    return (
        <Tree {...props} dropTarget={target} onDropTargetChange={setTarget} />
    );
}

export const DropTargetFolder: Story = {
    args: {
        draggingIds: new Set(["Ideas.md"]),
        dropTarget: { type: "folder", id: "projects/2026" },
    },
    render: (args) => <DropTargetStory {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("treeitem", { name: "2026" }),
        ).toHaveAttribute("data-drop-target", "true");
        await expect(
            canvas.getByRole("treeitem", { name: "Ideas" }),
        ).toHaveAttribute("data-dragging", "true");
    },
};

export const DropTargetRoot: Story = {
    args: {
        draggingIds: new Set(["Ideas.md"]),
        dropTarget: { type: "root" },
    },
};

export const FolderReadError: Story = {
    args: {
        nodes: [
            {
                kind: "folder",
                id: "locked",
                name: "locked",
                expanded: true,
                error: "Could not read this folder.",
                children: [],
            },
            { kind: "note", id: "Ideas.md", name: "Ideas" },
        ],
    },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByText("Could not read this folder."),
        ).toBeVisible();
    },
};

export const LongNames: Story = {
    args: {
        nodes: [
            {
                kind: "folder",
                id: "long",
                name: "A folder with a very long name that cannot fit in the sidebar",
                expanded: true,
                children: [
                    {
                        kind: "note",
                        id: "long/note.md",
                        name: "A note with a very long name that is truncated at the end of the row",
                    },
                ],
            },
        ],
        activeId: "long/note.md",
    },
};
