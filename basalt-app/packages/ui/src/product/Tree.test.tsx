import {
    act,
    createEvent,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tree } from "./Tree";
import type { TreeNode, TreeProps } from "./Tree";

const nodes: TreeNode[] = [
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
                expanded: false,
                children: [
                    { kind: "note", id: "projects/2026/Q1.md", name: "Q1" },
                ],
            },
            { kind: "note", id: "projects/Roadmap.md", name: "Roadmap" },
        ],
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

function handlers() {
    return {
        onToggleFolder: vi.fn(),
        onOpenNote: vi.fn(),
        onSelectionChange: vi.fn(),
        onClearSelection: vi.fn(),
        onContextMenuRequest: vi.fn(),
        onDragStart: vi.fn(),
        onDragEnd: vi.fn(),
        onDropTargetChange: vi.fn(),
        onDrop: vi.fn(),
        onFolderHoverOpen: vi.fn(),
    };
}

function setup(props: Partial<TreeProps> = {}) {
    const fns = handlers();
    const view = render(
        <Tree label="Notes" nodes={nodes} {...fns} {...props} />,
    );
    return { ...fns, ...view };
}

function Focusable(props: Partial<TreeProps>) {
    const [focusedId, setFocusedId] = useState<string | null>(null);
    return (
        <Tree
            label="Notes"
            nodes={nodes}
            focusedId={focusedId}
            onFocusChange={setFocusedId}
            onToggleFolder={() => {}}
            onOpenNote={() => {}}
            {...props}
        />
    );
}

const item = (name: string) => screen.getByRole("treeitem", { name });

const dataTransfer = () => ({
    setData: vi.fn(),
    effectAllowed: "",
    dropEffect: "",
});

afterEach(() => {
    vi.useRealTimers();
});

describe("Tree structure and ARIA", () => {
    it("is a labelled multiselectable tree with levels, sizes and groups", () => {
        setup({ activeId: "Ideas.md" });

        const tree = screen.getByRole("tree", { name: "Notes" });
        expect(tree.getAttribute("aria-multiselectable")).toBe("true");
        expect(item("projects").getAttribute("aria-level")).toBe("1");
        expect(item("Roadmap").getAttribute("aria-level")).toBe("2");
        expect(item("Roadmap").getAttribute("aria-posinset")).toBe("2");
        expect(item("Roadmap").getAttribute("aria-setsize")).toBe("2");
        expect(screen.getAllByRole("group")).toHaveLength(1);
        const group = screen.getByRole("group");
        expect(item("projects").getAttribute("aria-owns")).toBe(group.id);
        expect(group.contains(item("Roadmap"))).toBe(true);
        expect(group.contains(item("projects"))).toBe(false);
    });

    it("marks expansion on folders only and hides the children of collapsed ones", () => {
        setup();

        expect(item("projects").getAttribute("aria-expanded")).toBe("true");
        expect(item("2026").getAttribute("aria-expanded")).toBe("false");
        expect(item("Ideas").hasAttribute("aria-expanded")).toBe(false);
        expect(screen.queryByRole("treeitem", { name: "Q1" })).toBeNull();
    });

    it("marks only folders without aria-selected and the active note as selected", () => {
        setup({ activeId: "Ideas.md" });

        expect(item("projects").hasAttribute("aria-selected")).toBe(false);
        expect(item("Ideas").getAttribute("aria-selected")).toBe("true");
        expect(item("Ideas").getAttribute("aria-current")).toBe("true");
        expect(item("Weekly plan").getAttribute("aria-selected")).toBe("false");
    });

    it("shows the selection instead of the active note while several notes are selected", () => {
        setup({
            activeId: "Ideas.md",
            selectedIds: new Set(["projects/Roadmap.md", "Weekly plan.md"]),
        });

        expect(item("Ideas").getAttribute("aria-selected")).toBe("false");
        expect(item("Roadmap").getAttribute("aria-selected")).toBe("true");
        expect(item("Weekly plan").getAttribute("aria-selected")).toBe("true");
    });

    it("renders nothing under an empty folder", () => {
        setup();

        expect(item("empty").hasAttribute("aria-owns")).toBe(false);
        expect(screen.getAllByRole("group")).toHaveLength(1);
        expect(item("empty").getAttribute("aria-expanded")).toBe("true");
    });

    it("shows the read error of an expanded folder instead of its children", () => {
        setup({
            nodes: [
                {
                    kind: "folder",
                    id: "locked",
                    name: "locked",
                    expanded: true,
                    error: "Could not read this folder.",
                    children: [{ kind: "note", id: "locked/a.md", name: "a" }],
                },
            ],
        });

        expect(screen.getByText("Could not read this folder.")).toBeTruthy();
        expect(screen.queryByRole("treeitem", { name: "a" })).toBeNull();
    });

    it("does not show the read error while the folder is collapsed", () => {
        setup({
            nodes: [
                {
                    kind: "folder",
                    id: "locked",
                    name: "locked",
                    expanded: false,
                    error: "Could not read this folder.",
                    children: [],
                },
            ],
        });

        expect(screen.queryByText("Could not read this folder.")).toBeNull();
    });

    it("indents deeper rows more than their parents", () => {
        setup();

        const padding = (name: string) => item(name).style.paddingInlineStart;
        expect(padding("Roadmap")).not.toBe(padding("projects"));
        expect(padding("Roadmap")).toContain("* var(--bs-icon-size)");
    });
});

describe("Tree keyboard navigation", () => {
    it("has one tab stop that starts on the active note and moves with focus", async () => {
        const user = userEvent.setup();
        render(<Focusable activeId="Ideas.md" />);

        expect(
            screen
                .getAllByRole("treeitem")
                .filter((row) => row.getAttribute("tabindex") === "0"),
        ).toEqual([item("Ideas")]);

        await user.tab();
        expect(document.activeElement).toBe(item("Ideas"));

        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(item("Weekly plan"));
        expect(item("Weekly plan").getAttribute("tabindex")).toBe("0");
        expect(item("Ideas").getAttribute("tabindex")).toBe("-1");
    });

    it("falls back to the first row when nothing is focused or active", () => {
        setup();

        expect(item("projects").getAttribute("tabindex")).toBe("0");
    });

    it("moves with Arrow Up and Down through the visible rows and stops at the ends", async () => {
        const user = userEvent.setup();
        render(<Focusable />);

        await user.tab();
        await user.keyboard("{ArrowUp}");
        expect(document.activeElement).toBe(item("projects"));
        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(item("2026"));
        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(item("Roadmap"));
        await user.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(item("empty"));
    });

    it("jumps with Home and End", async () => {
        const user = userEvent.setup();
        render(<Focusable />);

        await user.tab();
        await user.keyboard("{End}");
        expect(document.activeElement).toBe(item("Weekly plan"));
        await user.keyboard("{Home}");
        expect(document.activeElement).toBe(item("projects"));
    });

    it("expands a collapsed folder with Arrow Right, then enters it", async () => {
        const user = userEvent.setup();
        const onToggleFolder = vi.fn();
        const { rerender } = render(
            <Focusable onToggleFolder={onToggleFolder} />,
        );

        await user.tab();
        await user.keyboard("{ArrowDown}{ArrowRight}");
        expect(onToggleFolder).toHaveBeenCalledWith("projects/2026");

        const expanded: TreeNode[] = [
            {
                ...(nodes[0] as Extract<TreeNode, { kind: "folder" }>),
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
                                name: "Q1",
                            },
                        ],
                    },
                ],
            },
        ];
        rerender(
            <Focusable nodes={expanded} onToggleFolder={onToggleFolder} />,
        );
        await user.keyboard("{ArrowRight}");
        expect(document.activeElement).toBe(item("Q1"));
    });

    it("does nothing on Arrow Right over a note", async () => {
        const user = userEvent.setup();
        const onToggleFolder = vi.fn();
        render(
            <Focusable activeId="Ideas.md" onToggleFolder={onToggleFolder} />,
        );

        await user.tab();
        await user.keyboard("{ArrowRight}");

        expect(onToggleFolder).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(item("Ideas"));
    });

    it("collapses an expanded folder with Arrow Left and goes to the parent from a child", async () => {
        const user = userEvent.setup();
        const onToggleFolder = vi.fn();
        render(<Focusable onToggleFolder={onToggleFolder} />);

        await user.tab();
        await user.keyboard("{ArrowLeft}");
        expect(onToggleFolder).toHaveBeenCalledWith("projects");

        await user.keyboard("{ArrowDown}{ArrowDown}{ArrowLeft}");
        expect(document.activeElement).toBe(item("projects"));
        expect(onToggleFolder).toHaveBeenCalledOnce();
    });

    it("opens a note and toggles a folder with Enter", async () => {
        const user = userEvent.setup();
        const onOpenNote = vi.fn();
        const onToggleFolder = vi.fn();
        render(
            <Focusable
                onOpenNote={onOpenNote}
                onToggleFolder={onToggleFolder}
            />,
        );

        await user.tab();
        await user.keyboard("{Enter}");
        expect(onToggleFolder).toHaveBeenCalledWith("projects");
        expect(onOpenNote).not.toHaveBeenCalled();

        await user.keyboard("{End}{Enter}");
        expect(onOpenNote).toHaveBeenCalledWith("Weekly plan.md");
    });

    it("toggles the selection of a note with Space but expands a folder instead", async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        const onToggleFolder = vi.fn();
        render(
            <Focusable
                onSelectionChange={onSelectionChange}
                onToggleFolder={onToggleFolder}
            />,
        );

        await user.tab();
        await user.keyboard(" ");
        expect(onToggleFolder).toHaveBeenCalledWith("projects");
        expect(onSelectionChange).not.toHaveBeenCalled();

        await user.keyboard("{End} ");
        expect(onSelectionChange).toHaveBeenCalledWith({
            mode: "toggle",
            id: "Weekly plan.md",
            visibleNoteIds: [
                "projects/Roadmap.md",
                "Ideas.md",
                "Weekly plan.md",
            ],
        });
    });
});

describe("Tree selection", () => {
    it("opens a note on a plain click and toggles a folder", async () => {
        const user = userEvent.setup();
        const { onOpenNote, onSelectionChange, onToggleFolder } = setup();

        await user.click(item("Ideas"));
        await user.click(item("2026"));

        expect(onOpenNote).toHaveBeenCalledOnce();
        expect(onOpenNote).toHaveBeenCalledWith("Ideas.md");
        expect(onToggleFolder).toHaveBeenCalledWith("projects/2026");
        expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("toggles the selection on Ctrl+click and Cmd+click without opening", async () => {
        const user = userEvent.setup();
        const { onOpenNote, onSelectionChange } = setup();
        const row = item("Ideas");
        const visibleNoteIds = [
            "projects/Roadmap.md",
            "Ideas.md",
            "Weekly plan.md",
        ];

        await user.keyboard("{Control>}");
        await user.click(row);
        await user.keyboard("{/Control}{Meta>}");
        await user.click(row);
        await user.keyboard("{/Meta}");

        expect(onSelectionChange).toHaveBeenNthCalledWith(1, {
            mode: "toggle",
            id: "Ideas.md",
            visibleNoteIds,
        });
        expect(onSelectionChange).toHaveBeenNthCalledWith(2, {
            mode: "toggle",
            id: "Ideas.md",
            visibleNoteIds,
        });
        expect(onOpenNote).not.toHaveBeenCalled();
    });

    it("requests a range on Shift+click with the visible notes in tree order", async () => {
        const user = userEvent.setup();
        const { onOpenNote, onSelectionChange } = setup();

        await user.keyboard("{Shift>}");
        await user.click(item("Weekly plan"));
        await user.keyboard("{/Shift}");

        expect(onSelectionChange).toHaveBeenCalledWith({
            mode: "range",
            id: "Weekly plan.md",
            visibleNoteIds: [
                "projects/Roadmap.md",
                "Ideas.md",
                "Weekly plan.md",
            ],
        });
        expect(onOpenNote).not.toHaveBeenCalled();
    });

    it("never selects a folder on a modified click", async () => {
        const user = userEvent.setup();
        const { onSelectionChange, onToggleFolder } = setup();

        await user.keyboard("{Control>}");
        await user.click(item("2026"));
        await user.keyboard("{/Control}");

        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onToggleFolder).toHaveBeenCalledWith("projects/2026");
    });

    it("reports the extend before it reports the focus change so the previous row is still known", async () => {
        const user = userEvent.setup();
        const calls: string[] = [];
        render(
            <Focusable
                activeId="Ideas.md"
                onSelectionChange={() => calls.push("selection")}
                onFocusChange={() => calls.push("focus")}
            />,
        );
        await user.tab();
        calls.length = 0;

        await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

        expect(calls.slice(0, 2)).toEqual(["selection", "focus"]);
    });

    it("extends the selection with Shift+Arrow onto a note but not onto a folder", async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        render(
            <Focusable
                activeId="Ideas.md"
                onSelectionChange={onSelectionChange}
            />,
        );

        await user.tab();
        await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
        expect(onSelectionChange).toHaveBeenCalledWith({
            mode: "extend",
            id: "Weekly plan.md",
            visibleNoteIds: [
                "projects/Roadmap.md",
                "Ideas.md",
                "Weekly plan.md",
            ],
        });
        expect(document.activeElement).toBe(item("Weekly plan"));

        onSelectionChange.mockClear();
        await user.keyboard("{Shift>}{ArrowUp}{ArrowUp}{ArrowUp}{/Shift}");
        expect(document.activeElement).toBe(item("Roadmap"));
        expect(
            onSelectionChange.mock.calls.map(([change]) => change.id),
        ).toEqual(["Ideas.md", "projects/Roadmap.md"]);
    });

    it("clears the selection with Escape only while something is selected", async () => {
        const user = userEvent.setup();
        const onClearSelection = vi.fn();
        const { rerender } = render(
            <Focusable onClearSelection={onClearSelection} />,
        );

        await user.tab();
        await user.keyboard("{Escape}");
        expect(onClearSelection).not.toHaveBeenCalled();

        rerender(
            <Focusable
                selectedIds={new Set(["Ideas.md"])}
                onClearSelection={onClearSelection}
            />,
        );
        await user.keyboard("{Escape}");
        expect(onClearSelection).toHaveBeenCalledOnce();
    });
});

describe("Tree context menu requests", () => {
    it("reports the right-clicked row with the pointer position", () => {
        const { onContextMenuRequest } = setup();

        fireEvent.contextMenu(item("Ideas"), {
            clientX: 12,
            clientY: 34,
        });

        expect(onContextMenuRequest).toHaveBeenCalledWith("Ideas.md", {
            x: 12,
            y: 34,
        });
    });

    it("reports the innermost row, not its folder", () => {
        const { onContextMenuRequest } = setup();

        fireEvent.contextMenu(item("Roadmap"), { clientX: 1, clientY: 2 });

        expect(onContextMenuRequest).toHaveBeenCalledOnce();
        expect(onContextMenuRequest).toHaveBeenCalledWith(
            "projects/Roadmap.md",
            { x: 1, y: 2 },
        );
    });

    it("reports null for the workspace root when no row is hit", () => {
        const { onContextMenuRequest } = setup();

        fireEvent.contextMenu(screen.getByRole("tree"), {
            clientX: 5,
            clientY: 6,
        });

        expect(onContextMenuRequest).toHaveBeenCalledWith(null, {
            x: 5,
            y: 6,
        });
    });

    it("prevents the native menu", () => {
        setup();

        expect(fireEvent.contextMenu(item("Ideas"))).toBe(false);
    });

    it("opens for the focused row with Shift+F10 and the Menu key", async () => {
        const user = userEvent.setup();
        const onContextMenuRequest = vi.fn();
        render(
            <Focusable
                activeId="Ideas.md"
                onContextMenuRequest={onContextMenuRequest}
            />,
        );

        await user.tab();
        await user.keyboard("{Shift>}{F10}{/Shift}");
        await user.keyboard("{ContextMenu}");

        expect(onContextMenuRequest).toHaveBeenCalledTimes(2);
        expect(onContextMenuRequest).toHaveBeenCalledWith("Ideas.md", {
            x: expect.any(Number),
            y: expect.any(Number),
        });
    });

    it("ignores a bare F10", async () => {
        const user = userEvent.setup();
        const onContextMenuRequest = vi.fn();
        render(<Focusable onContextMenuRequest={onContextMenuRequest} />);

        await user.tab();
        await user.keyboard("{F10}");

        expect(onContextMenuRequest).not.toHaveBeenCalled();
    });
});

describe("Tree drag and drop", () => {
    it("drags note and folder rows and reports the id", () => {
        const { onDragStart } = setup();
        const transfer = dataTransfer();

        expect(item("Ideas").getAttribute("draggable")).toBe("true");
        expect(item("projects").getAttribute("draggable")).toBe("true");

        fireEvent.dragStart(item("Ideas"), { dataTransfer: transfer });
        expect(onDragStart).toHaveBeenCalledWith("Ideas.md");
        expect(transfer.setData).toHaveBeenCalledWith("text/plain", "Ideas.md");
        expect(transfer.effectAllowed).toBe("move");

        onDragStart.mockClear();
        fireEvent.dragStart(item("empty"), { dataTransfer: dataTransfer() });
        expect(onDragStart).toHaveBeenCalledWith("empty");
    });

    it("can turn dragging off", () => {
        setup({ draggable: false });

        expect(item("Ideas").hasAttribute("draggable")).toBe(false);
    });

    it("reports the end of a drag", () => {
        const { onDragEnd } = setup();

        fireEvent.dragEnd(item("Ideas"));

        expect(onDragEnd).toHaveBeenCalledOnce();
    });

    it("makes a folder the drop target while dragging notes", () => {
        const { onDropTargetChange } = setup({
            draggingIds: new Set(["Ideas.md"]),
        });

        const allowed = !fireEvent.dragOver(item("empty"), {
            dataTransfer: dataTransfer(),
        });

        expect(allowed).toBe(true);
        expect(onDropTargetChange).toHaveBeenCalledWith({
            type: "folder",
            id: "empty",
        });
    });

    it("makes the root the drop target over empty space", () => {
        const { onDropTargetChange } = setup({
            draggingIds: new Set(["Ideas.md"]),
        });

        const prevented = !fireEvent.dragOver(screen.getByRole("tree"), {
            dataTransfer: dataTransfer(),
        });

        expect(prevented).toBe(true);
        expect(onDropTargetChange).toHaveBeenCalledWith({ type: "root" });
    });

    it("does not accept a drop on a note row and clears the target", () => {
        const { onDropTargetChange } = setup({
            draggingIds: new Set(["Ideas.md"]),
            dropTarget: { type: "folder", id: "empty" },
        });

        const prevented = !fireEvent.dragOver(item("Weekly plan"), {
            dataTransfer: dataTransfer(),
        });

        expect(prevented).toBe(false);
        expect(onDropTargetChange).toHaveBeenCalledWith(null);
    });

    it("does not report an unchanged target again", () => {
        const { onDropTargetChange } = setup({
            draggingIds: new Set(["Ideas.md"]),
            dropTarget: { type: "folder", id: "empty" },
        });

        fireEvent.dragOver(item("empty"), { dataTransfer: dataTransfer() });

        expect(onDropTargetChange).not.toHaveBeenCalled();
    });

    it("ignores drags that did not start on a note row", () => {
        const { onDropTargetChange, onDrop } = setup();

        const prevented = !fireEvent.dragOver(item("empty"), {
            dataTransfer: dataTransfer(),
        });
        fireEvent.drop(item("empty"), { dataTransfer: dataTransfer() });

        expect(prevented).toBe(false);
        expect(onDropTargetChange).not.toHaveBeenCalled();
        expect(onDrop).not.toHaveBeenCalled();
    });

    it("drops on a folder and on the root", () => {
        const { onDrop } = setup({ draggingIds: new Set(["Ideas.md"]) });

        const handled = !fireEvent.drop(item("empty"), {
            dataTransfer: dataTransfer(),
        });
        fireEvent.drop(screen.getByRole("tree"), {
            dataTransfer: dataTransfer(),
        });

        expect(handled).toBe(true);
        expect(onDrop).toHaveBeenNthCalledWith(1, {
            type: "folder",
            id: "empty",
        });
        expect(onDrop).toHaveBeenNthCalledWith(2, { type: "root" });
    });

    it("does not drop on a note row", () => {
        const { onDrop } = setup({ draggingIds: new Set(["Ideas.md"]) });

        fireEvent.drop(item("Weekly plan"), { dataTransfer: dataTransfer() });

        expect(onDrop).not.toHaveBeenCalled();
    });

    it("clears the target when the pointer leaves the tree but not when it moves inside", () => {
        const { onDropTargetChange } = setup({
            draggingIds: new Set(["Ideas.md"]),
            dropTarget: { type: "folder", id: "empty" },
        });

        const leave = (relatedTarget: Element) => {
            const event = createEvent.dragLeave(item("empty"));
            Object.defineProperty(event, "relatedTarget", {
                value: relatedTarget,
            });
            fireEvent(item("empty"), event);
        };

        leave(item("Ideas"));
        expect(onDropTargetChange).not.toHaveBeenCalled();

        leave(document.body);
        expect(onDropTargetChange).toHaveBeenCalledWith(null);
    });

    it("styles the drop target and the dragged rows", () => {
        setup({
            draggingIds: new Set(["Ideas.md"]),
            dropTarget: { type: "folder", id: "empty" },
        });

        expect(item("empty").getAttribute("data-drop-target")).toBe("true");
        expect(item("projects").hasAttribute("data-drop-target")).toBe(false);
        expect(item("Ideas").getAttribute("data-dragging")).toBe("true");
        expect(item("Weekly plan").hasAttribute("data-dragging")).toBe(false);
    });

    it("highlights the root while it is the drop target", () => {
        const { rerender } = setup({ dropTarget: { type: "root" } });
        const before = screen.getByRole("tree").className;

        rerender(
            <Tree
                label="Notes"
                nodes={nodes}
                onToggleFolder={() => {}}
                onOpenNote={() => {}}
            />,
        );

        expect(before).toContain("focus-ring-inset");
        expect(screen.getByRole("tree").className).not.toContain(
            "focus-ring-inset",
        );
    });
});

describe("Tree hover to open", () => {
    const collapsed: TreeNode[] = [
        {
            kind: "folder",
            id: "a",
            name: "a",
            expanded: false,
            children: [{ kind: "note", id: "a/n.md", name: "n" }],
        },
        {
            kind: "folder",
            id: "b",
            name: "b",
            expanded: false,
            children: [{ kind: "note", id: "b/n.md", name: "n" }],
        },
    ];

    const tree = (props: Partial<TreeProps>) => (
        <Tree
            label="Notes"
            nodes={collapsed}
            onToggleFolder={() => {}}
            onOpenNote={() => {}}
            {...props}
        />
    );

    it("opens a collapsed folder after 600 ms of hovering and only once", () => {
        vi.useFakeTimers();
        const onFolderHoverOpen = vi.fn();
        render(
            tree({
                dropTarget: { type: "folder", id: "a" },
                onFolderHoverOpen,
            }),
        );

        act(() => vi.advanceTimersByTime(599));
        expect(onFolderHoverOpen).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(1));
        expect(onFolderHoverOpen).toHaveBeenCalledExactlyOnceWith("a");
        act(() => vi.advanceTimersByTime(5000));
        expect(onFolderHoverOpen).toHaveBeenCalledOnce();
    });

    it("cancels when the pointer leaves before the delay", () => {
        vi.useFakeTimers();
        const onFolderHoverOpen = vi.fn();
        const { rerender } = render(
            tree({
                dropTarget: { type: "folder", id: "a" },
                onFolderHoverOpen,
            }),
        );

        act(() => vi.advanceTimersByTime(400));
        rerender(tree({ dropTarget: null, onFolderHoverOpen }));
        act(() => vi.advanceTimersByTime(5000));

        expect(onFolderHoverOpen).not.toHaveBeenCalled();
    });

    it("restarts the delay for another folder", () => {
        vi.useFakeTimers();
        const onFolderHoverOpen = vi.fn();
        const { rerender } = render(
            tree({
                dropTarget: { type: "folder", id: "a" },
                onFolderHoverOpen,
            }),
        );

        act(() => vi.advanceTimersByTime(400));
        rerender(
            tree({
                dropTarget: { type: "folder", id: "b" },
                onFolderHoverOpen,
            }),
        );
        act(() => vi.advanceTimersByTime(400));
        expect(onFolderHoverOpen).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(200));
        expect(onFolderHoverOpen).toHaveBeenCalledExactlyOnceWith("b");
    });

    it("keeps the delay running when the parent re-renders with a new callback", () => {
        vi.useFakeTimers();
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(
            tree({
                dropTarget: { type: "folder", id: "a" },
                onFolderHoverOpen: first,
            }),
        );

        act(() => vi.advanceTimersByTime(400));
        rerender(
            tree({
                dropTarget: { type: "folder", id: "a" },
                onFolderHoverOpen: second,
            }),
        );
        act(() => vi.advanceTimersByTime(200));

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledExactlyOnceWith("a");
    });

    it("does nothing for an expanded folder, an empty folder, the root or a missing folder", () => {
        vi.useFakeTimers();
        const onFolderHoverOpen = vi.fn();
        const open: TreeNode[] = [
            {
                kind: "folder",
                id: "o",
                name: "o",
                expanded: true,
                children: [{ kind: "note", id: "o/n.md", name: "n" }],
            },
            {
                kind: "folder",
                id: "e",
                name: "e",
                expanded: false,
                children: [],
            },
        ];
        const { rerender } = render(
            tree({
                nodes: open,
                dropTarget: { type: "folder", id: "o" },
                onFolderHoverOpen,
            }),
        );
        rerender(
            tree({
                nodes: open,
                dropTarget: { type: "folder", id: "e" },
                onFolderHoverOpen,
            }),
        );
        rerender(
            tree({
                nodes: open,
                dropTarget: { type: "root" },
                onFolderHoverOpen,
            }),
        );
        rerender(
            tree({
                nodes: open,
                dropTarget: { type: "folder", id: "gone" },
                onFolderHoverOpen,
            }),
        );
        act(() => vi.advanceTimersByTime(5000));

        expect(onFolderHoverOpen).not.toHaveBeenCalled();
    });

    it("clears the timer on unmount", () => {
        vi.useFakeTimers();
        const onFolderHoverOpen = vi.fn();
        const { unmount } = render(
            tree({
                dropTarget: { type: "folder", id: "a" },
                onFolderHoverOpen,
            }),
        );

        unmount();
        act(() => vi.advanceTimersByTime(5000));

        expect(onFolderHoverOpen).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("honours a custom delay", () => {
        vi.useFakeTimers();
        const onFolderHoverOpen = vi.fn();
        render(
            tree({
                dropTarget: { type: "folder", id: "a" },
                hoverOpenDelay: 50,
                onFolderHoverOpen,
            }),
        );

        act(() => vi.advanceTimersByTime(50));

        expect(onFolderHoverOpen).toHaveBeenCalledOnce();
    });
});
