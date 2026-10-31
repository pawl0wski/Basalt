import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "../../src/lib/utils";

type Node = { name: string; children?: Node[] };

const tree: Node[] = [
    {
        name: "journal",
        children: [{ name: "Daily 2026-10-18" }, { name: "Daily 2026-10-19" }],
    },
    {
        name: "projects",
        children: [
            { name: "Roadmap" },
            { name: "Sync server spec" },
            { name: "archive", children: [{ name: "Old ideas" }] },
        ],
    },
    { name: "Ideas" },
    { name: "Meeting notes" },
    { name: "Reading list" },
    { name: "Shopping" },
    { name: "Weekly plan" },
];

type RowProps = {
    node: Node;
    selected: string;
    onSelect: (name: string) => void;
    startOpen?: string[];
};

function Row({ node, selected, onSelect, startOpen = [] }: RowProps) {
    const [open, setOpen] = useState(startOpen.includes(node.name));
    const isFolder = Boolean(node.children);
    const isSelected = !isFolder && selected === node.name;
    const Chevron = open ? ChevronDown : ChevronRight;

    return (
        <div>
            <button
                type="button"
                onClick={() =>
                    isFolder ? setOpen(!open) : onSelect(node.name)
                }
                className={cn(
                    "relative flex h-tree-row w-full items-center gap-in-group rounded-control pl-in-group pr-between-groups text-left text-size-ui text-text-ui motion-feedback hover:bg-state-hover focus-visible:focus-ring-inset",
                    isSelected &&
                        "bg-state-selected text-text-note hover:bg-state-selected group-focus-within:bg-tree-selected group-focus-within:hover:bg-tree-selected",
                )}
            >
                {isFolder ? (
                    <Chevron
                        aria-hidden="true"
                        className="size-icon shrink-0 text-icon-default"
                    />
                ) : (
                    <span aria-hidden="true" className="size-icon shrink-0" />
                )}
                <span className="truncate">{node.name}</span>
            </button>
            {isFolder && open ? (
                <div className="ml-between-groups border-l border-border-divider">
                    {node.children?.map((child) => (
                        <Row
                            key={child.name}
                            node={child}
                            selected={selected}
                            onSelect={onSelect}
                            startOpen={startOpen}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function FolderTree({ startOpen }: { startOpen?: string[] }) {
    const [selected, setSelected] = useState("Roadmap");
    return (
        <div className="group flex w-sidebar flex-col bg-surface-card p-in-group">
            {tree.map((node) => (
                <Row
                    key={node.name}
                    node={node}
                    selected={selected}
                    onSelect={setSelected}
                    startOpen={startOpen}
                />
            ))}
        </div>
    );
}

const meta = {
    title: "Proposals/Folder tree (E01-S04 direction)",
    component: FolderTree,
    tags: ["!autodocs"],
    parameters: {
        layout: "padded",
        a11y: { test: "off" },
        docs: { disable: true },
    },
} satisfies Meta<typeof FolderTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClickToExpand: Story = { args: { startOpen: ["projects"] } };
export const AllCollapsed: Story = { args: { startOpen: [] } };
