import {
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    FolderOpen,
} from "lucide-react";
import type {
    DragEvent,
    KeyboardEvent,
    MouseEvent,
    ReactNode,
    Ref,
} from "react";
import { useEffect, useId, useMemo, useRef } from "react";
import { cn } from "../lib/utils";

type TreeFolderNode = {
    kind: "folder";
    id: string;
    name: string;
    expanded: boolean;
    children: TreeNode[];
    error?: ReactNode;
};

type TreeNoteNode = {
    kind: "note";
    id: string;
    name: string;
};

type TreeNode = TreeFolderNode | TreeNoteNode;

type TreeDropTarget = { type: "root" } | { type: "folder"; id: string };

type TreeSelectionChange = {
    mode: "toggle" | "range" | "extend";
    id: string;
    visibleNoteIds: string[];
};

type TreePoint = { x: number; y: number };

type TreeProps = {
    label: string;
    nodes: TreeNode[];
    selectedIds?: ReadonlySet<string>;
    activeId?: string | null;
    focusedId?: string | null;
    onFocusChange?: (id: string) => void;
    onToggleFolder: (id: string) => void;
    onOpenNote: (id: string) => void;
    onSelectionChange?: (change: TreeSelectionChange) => void;
    onClearSelection?: () => void;
    onContextMenuRequest?: (id: string | null, point: TreePoint) => void;
    draggable?: boolean;
    draggingIds?: ReadonlySet<string>;
    dropTarget?: TreeDropTarget | null;
    onDragStart?: (id: string) => void;
    onDragEnd?: () => void;
    onDropTargetChange?: (target: TreeDropTarget | null) => void;
    onDrop?: (target: TreeDropTarget) => void;
    onFolderHoverOpen?: (id: string) => void;
    hoverOpenDelay?: number;
    className?: string;
};

type VisibleRow = {
    node: TreeNode;
    parentId: string | null;
};

const NO_IDS: ReadonlySet<string> = new Set();

function collectVisible(
    nodes: TreeNode[],
    parentId: string | null,
    rows: VisibleRow[],
) {
    for (const node of nodes) {
        rows.push({ node, parentId });
        if (node.kind === "folder" && node.expanded)
            collectVisible(node.children, node.id, rows);
    }
}

function treeItemOf(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element
        ? target.closest<HTMLElement>('[role="treeitem"]')
        : null;
}

function Tree({
    label,
    nodes,
    selectedIds = NO_IDS,
    activeId = null,
    focusedId = null,
    onFocusChange,
    onToggleFolder,
    onOpenNote,
    onSelectionChange,
    onClearSelection,
    onContextMenuRequest,
    draggable = true,
    draggingIds = NO_IDS,
    dropTarget = null,
    onDragStart,
    onDragEnd,
    onDropTargetChange,
    onDrop,
    onFolderHoverOpen,
    hoverOpenDelay = 600,
    className,
}: TreeProps) {
    const baseId = useId();
    const items = useRef(new Map<string, HTMLElement>());
    const hoverOpen = useRef(onFolderHoverOpen);

    useEffect(() => {
        hoverOpen.current = onFolderHoverOpen;
    }, [onFolderHoverOpen]);

    const rows = useMemo(() => {
        const collected: VisibleRow[] = [];
        collectVisible(nodes, null, collected);
        return collected;
    }, [nodes]);

    const visibleNoteIds = useMemo(
        () =>
            rows.flatMap(({ node }) => (node.kind === "note" ? [node.id] : [])),
        [rows],
    );

    const dropFolderId = dropTarget?.type === "folder" ? dropTarget.id : null;
    const hoverFolder = rows.find(
        ({ node }) => node.kind === "folder" && node.id === dropFolderId,
    )?.node;
    const hoverOpens =
        hoverFolder?.kind === "folder" &&
        !hoverFolder.expanded &&
        hoverFolder.children.length > 0;

    useEffect(() => {
        if (dropFolderId === null || !hoverOpens) return;
        const timer = setTimeout(
            () => hoverOpen.current?.(dropFolderId),
            hoverOpenDelay,
        );
        return () => clearTimeout(timer);
    }, [dropFolderId, hoverOpens, hoverOpenDelay]);

    const rowIds = rows.map(({ node }) => node.id);
    const tabStopId = [focusedId, ...selectedIds, activeId].find(
        (id): id is string => id !== null && rowIds.includes(id),
    );
    const tabStop = tabStopId ?? rowIds[0];
    const multiSelecting = selectedIds.size > 0;

    const moveFocus = (id: string | undefined) => {
        if (id === undefined) return;
        onFocusChange?.(id);
        items.current.get(id)?.focus();
    };

    const pointOfRow = (id: string): TreePoint => {
        const rect = items.current.get(id)?.getBoundingClientRect();
        return rect
            ? { x: rect.left, y: rect.top + rect.height }
            : { x: 0, y: 0 };
    };

    const activate = (node: TreeNode, event: MouseEvent) => {
        onFocusChange?.(node.id);
        if (node.kind === "folder") {
            onToggleFolder(node.id);
            return;
        }
        if (event.shiftKey)
            onSelectionChange?.({ mode: "range", id: node.id, visibleNoteIds });
        else if (event.ctrlKey || event.metaKey)
            onSelectionChange?.({
                mode: "toggle",
                id: node.id,
                visibleNoteIds,
            });
        else onOpenNote(node.id);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
        const element = treeItemOf(event.target);
        const id = element?.dataset.treeId;
        if (!element || id === undefined) return;
        const index = rowIds.indexOf(id);
        if (index === -1) return;
        const { node, parentId } = rows[index];

        if (
            event.key === "ContextMenu" ||
            (event.key === "F10" && event.shiftKey)
        ) {
            event.preventDefault();
            onContextMenuRequest?.(id, pointOfRow(id));
            return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey) return;

        switch (event.key) {
            case "ArrowDown":
            case "ArrowUp": {
                const next = rows[index + (event.key === "ArrowDown" ? 1 : -1)];
                event.preventDefault();
                if (!next) return;
                if (event.shiftKey && next.node.kind === "note")
                    onSelectionChange?.({
                        mode: "extend",
                        id: next.node.id,
                        visibleNoteIds,
                    });
                moveFocus(next.node.id);
                return;
            }
            case "Home":
                event.preventDefault();
                moveFocus(rowIds[0]);
                return;
            case "End":
                event.preventDefault();
                moveFocus(rowIds[rowIds.length - 1]);
                return;
            case "ArrowRight":
                event.preventDefault();
                if (node.kind !== "folder") return;
                if (!node.expanded) onToggleFolder(node.id);
                else if (node.children.length > 0)
                    moveFocus(node.children[0].id);
                return;
            case "ArrowLeft":
                event.preventDefault();
                if (node.kind === "folder" && node.expanded)
                    onToggleFolder(node.id);
                else if (parentId !== null) moveFocus(parentId);
                return;
            case "Enter":
                event.preventDefault();
                if (node.kind === "folder") onToggleFolder(node.id);
                else onOpenNote(node.id);
                return;
            case " ":
                event.preventDefault();
                if (node.kind === "folder") onToggleFolder(node.id);
                else
                    onSelectionChange?.({
                        mode: "toggle",
                        id: node.id,
                        visibleNoteIds,
                    });
                return;
            case "Escape":
                if (!multiSelecting) return;
                event.preventDefault();
                onClearSelection?.();
                return;
        }
    };

    const handleContextMenu = (event: MouseEvent<HTMLUListElement>) => {
        event.preventDefault();
        const id = treeItemOf(event.target)?.dataset.treeId ?? null;
        onContextMenuRequest?.(id, { x: event.clientX, y: event.clientY });
    };

    const handleDragStart = (event: DragEvent<HTMLUListElement>) => {
        const element = treeItemOf(event.target);
        const id = element?.dataset.treeId;
        if (!element || id === undefined) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        onDragStart?.(id);
    };

    const targetOf = (event: DragEvent): TreeDropTarget | null => {
        const element = treeItemOf(event.target);
        if (!element) return { type: "root" };
        const id = element.dataset.treeId;
        return element.dataset.kind === "folder" && id !== undefined
            ? { type: "folder", id }
            : null;
    };

    const sameTarget = (a: TreeDropTarget | null, b: TreeDropTarget | null) =>
        a === b ||
        (a !== null &&
            b !== null &&
            a.type === b.type &&
            (a.type === "root" || (b.type === "folder" && a.id === b.id)));

    const handleDragOver = (event: DragEvent<HTMLUListElement>) => {
        if (draggingIds.size === 0) return;
        const target = targetOf(event);
        if (target) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        }
        if (!sameTarget(target, dropTarget)) onDropTargetChange?.(target);
    };

    const handleDragLeave = (event: DragEvent<HTMLUListElement>) => {
        if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
        )
            return;
        if (dropTarget !== null) onDropTargetChange?.(null);
    };

    const handleDrop = (event: DragEvent<HTMLUListElement>) => {
        if (draggingIds.size === 0) return;
        const target = targetOf(event);
        if (!target) return;
        event.preventDefault();
        onDrop?.(target);
    };

    const renderNodes = (list: TreeNode[], depth: number): ReactNode =>
        list.map((node, position) => {
            const groupId = `${baseId}-g-${encodeURIComponent(node.id)}`;
            const labelId = `${baseId}-l-${encodeURIComponent(node.id)}`;
            const folder = node.kind === "folder";
            const expanded = folder && node.expanded;
            const selected = multiSelecting
                ? selectedIds.has(node.id)
                : node.id === activeId;
            const isDropTarget = dropFolderId === node.id;
            const showChildren =
                folder && expanded && !node.error && node.children.length > 0;
            const Icon = folder ? (expanded ? FolderOpen : Folder) : FileText;
            const Chevron = expanded ? ChevronDown : ChevronRight;

            const itemRef: Ref<HTMLDivElement> = (element) => {
                if (element) items.current.set(node.id, element);
                else items.current.delete(node.id);
            };

            return (
                <li
                    key={node.id}
                    role="none"
                    className="m-none list-none p-none"
                >
                    <div
                        ref={itemRef}
                        role="treeitem"
                        aria-labelledby={labelId}
                        aria-level={depth + 1}
                        aria-setsize={list.length}
                        aria-posinset={position + 1}
                        aria-expanded={folder ? expanded : undefined}
                        aria-selected={folder ? undefined : selected}
                        aria-current={node.id === activeId ? "true" : undefined}
                        aria-owns={showChildren ? groupId : undefined}
                        data-tree-id={node.id}
                        data-kind={node.kind}
                        data-drop-target={isDropTarget ? "true" : undefined}
                        data-dragging={
                            draggingIds.has(node.id) ? "true" : undefined
                        }
                        tabIndex={node.id === tabStop ? 0 : -1}
                        draggable={draggable ? true : undefined}
                        onClick={(event) => activate(node, event)}
                        onFocus={(event) => {
                            if (event.target === event.currentTarget)
                                onFocusChange?.(node.id);
                        }}
                        style={{
                            paddingInlineStart: `calc(var(--bs-space-in-group) + ${depth} * var(--bs-icon-size))`,
                        }}
                        className={cn(
                            "bs-tree-row flex h-tree-row cursor-default items-center gap-in-group rounded-control pe-between-groups text-size-ui text-text-ui outline-none motion-feedback hover:bg-state-hover focus-visible:focus-ring-inset",
                            selected &&
                                "bg-state-selected text-text-note hover:bg-state-selected group-focus-within/tree:bg-tree-selected group-focus-within/tree:hover:bg-tree-selected",
                            draggingIds.has(node.id) && "text-text-muted",
                            isDropTarget &&
                                "bg-state-selected focus-ring-inset",
                        )}
                    >
                        {folder ? (
                            <Chevron
                                aria-hidden="true"
                                className="size-icon shrink-0 text-icon-default"
                            />
                        ) : (
                            <span
                                aria-hidden="true"
                                className="size-icon shrink-0"
                            />
                        )}
                        <Icon
                            aria-hidden="true"
                            className="size-icon shrink-0 text-icon-default"
                        />
                        <span id={labelId} className="truncate">
                            {node.name}
                        </span>
                    </div>
                    {folder && expanded && node.error ? (
                        <p
                            style={{
                                paddingInlineStart: `calc(var(--bs-space-in-group) + ${depth + 2} * var(--bs-icon-size))`,
                            }}
                            className="m-none pe-between-groups py-in-group text-size-ui-small text-status-danger"
                        >
                            {node.error}
                        </p>
                    ) : null}
                    {showChildren ? (
                        <ul
                            id={groupId}
                            role="group"
                            className="m-none flex list-none flex-col p-none"
                        >
                            {renderNodes(node.children, depth + 1)}
                        </ul>
                    ) : null}
                </li>
            );
        });

    return (
        <ul
            role="tree"
            aria-label={label}
            aria-multiselectable="true"
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragEnd={() => onDragEnd?.()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "bs-tree group/tree m-none flex list-none flex-col p-in-group",
                dropTarget?.type === "root" && "focus-ring-inset",
                className,
            )}
        >
            {renderNodes(nodes, 0)}
        </ul>
    );
}

export { Tree };
export type {
    TreeDropTarget,
    TreeFolderNode,
    TreeNode,
    TreeNoteNode,
    TreePoint,
    TreeProps,
    TreeSelectionChange,
};
