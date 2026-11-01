import { cn } from "@basalt/ui";
import type { MenuEntry } from "@basalt/ui";
import {
    ChevronDown,
    ChevronRight,
    FilePlus,
    FileText,
    Folder,
    FolderOpen,
    FolderPlus,
    Pencil,
    Trash2,
} from "lucide-react";
import type { DragEvent, KeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { baseName, folderOf, noteName } from "../model/names";
import { listedFiles } from "../model/reducer";
import { useStore } from "../model/store";
import type { Files } from "../model/types";
import { ContextMenu } from "./ContextMenu";

type TreeNode =
    | { kind: "folder"; path: string; name: string; children: TreeNode[] }
    | { kind: "note"; path: string; name: string };

const HIDDEN_FOLDERS = new Set(["attachments"]);

function collator(a: string, b: string) {
    return a.localeCompare(b, "en", { sensitivity: "base" });
}

export function buildTree(files: Files, folder = ""): TreeNode[] {
    const nodes: TreeNode[] = [];
    for (const [path, entry] of Object.entries(files)) {
        if (folderOf(path) !== folder) continue;
        if (entry.kind === "folder" && !HIDDEN_FOLDERS.has(path))
            nodes.push({
                kind: "folder",
                path,
                name: baseName(path),
                children: buildTree(files, path),
            });
        if (entry.kind === "note")
            nodes.push({ kind: "note", path, name: noteName(path) });
    }
    return nodes.sort((a, b) =>
        a.kind === b.kind
            ? collator(a.name, b.name)
            : a.kind === "folder"
              ? -1
              : 1,
    );
}

type MenuKind = "note" | "folder" | "root" | "selection";
type OpenMenu = (path: string, kind: MenuKind, x: number, y: number) => void;

function visibleNotes(nodes: TreeNode[], expanded: string[]): string[] {
    return nodes.flatMap((node) =>
        node.kind === "note"
            ? [node.path]
            : expanded.includes(node.path)
              ? visibleNotes(node.children, expanded)
              : [],
    );
}

function menuItems(
    path: string,
    kind: MenuKind,
    dispatch: ReturnType<typeof useStore>["dispatch"],
    selected: string[],
): MenuEntry[] {
    if (kind === "selection")
        return [
            {
                label: `Delete ${selected.length} notes`,
                destructive: true,
                icon: <Trash2 aria-hidden="true" />,
                onSelect: () =>
                    dispatch({
                        type: "open-dialog",
                        dialog: { kind: "delete", paths: selected },
                    }),
            },
        ];
    if (kind === "note")
        return [
            {
                label: "Rename",
                icon: <Pencil aria-hidden="true" />,
                onSelect: () =>
                    dispatch({
                        type: "open-dialog",
                        dialog: { kind: "rename", path, name: noteName(path) },
                    }),
            },
            {
                label: "Delete",
                destructive: true,
                icon: <Trash2 aria-hidden="true" />,
                onSelect: () =>
                    dispatch({
                        type: "open-dialog",
                        dialog: { kind: "delete", paths: [path] },
                    }),
            },
        ];
    return [
        {
            label: "New note",
            icon: <FilePlus aria-hidden="true" />,
            onSelect: () => dispatch({ type: "quick-note", folder: path }),
        },
        {
            label: "New folder",
            icon: <FolderPlus aria-hidden="true" />,
            onSelect: () =>
                dispatch({
                    type: "open-dialog",
                    dialog: { kind: "new-folder", parent: path, name: "" },
                }),
        },
    ];
}

function Row({
    node,
    depthKey,
    openMenu,
    visible,
}: {
    node: TreeNode;
    depthKey: string;
    openMenu: OpenMenu;
    visible: string[];
}) {
    const { state, dispatch } = useStore();
    const expanded =
        node.kind === "folder" && state.expanded.includes(node.path);
    const selected =
        node.kind === "note" &&
        (state.selection.length > 0
            ? state.selection.includes(node.path)
            : state.active === node.path);
    const dropTarget = node.kind === "folder" && state.drag?.over === node.path;
    const hovering = dropTarget && !expanded;
    useEffect(() => {
        if (!hovering) return;
        const timer = setTimeout(
            () => dispatch({ type: "toggle-folder", path: node.path }),
            600,
        );
        return () => clearTimeout(timer);
    }, [hovering, node.path, dispatch]);
    const Chevron = expanded ? ChevronDown : ChevronRight;
    const Icon =
        node.kind === "note" ? FileText : expanded ? FolderOpen : Folder;

    const handleDragOver = (event: DragEvent) => {
        if (node.kind !== "folder" || !state.drag) return;
        event.preventDefault();
        if (state.drag.over !== node.path)
            dispatch({
                type: "drag",
                drag: { ...state.drag, over: node.path },
            });
    };

    const handleDrop = (event: DragEvent) => {
        if (node.kind !== "folder" || !state.drag) return;
        event.preventDefault();
        dispatch({ type: "move", paths: state.drag.paths, to: node.path });
    };

    return (
        <li role="none" key={depthKey}>
            <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openMenu(
                        node.path,
                        node.kind,
                        event.clientX,
                        event.clientY,
                    );
                }}
                className={cn(
                    "flex items-center rounded-control",
                    selected &&
                        "bg-state-selected text-text-note group-focus-within:bg-tree-selected",
                    dropTarget && "bg-state-selected",
                )}
            >
                <button
                    type="button"
                    role="treeitem"
                    data-path={node.path}
                    aria-selected={selected}
                    aria-expanded={
                        node.kind === "folder" ? expanded : undefined
                    }
                    draggable={node.kind === "note"}
                    onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", node.path);
                        const together =
                            state.selection.length > 1 &&
                            state.selection.includes(node.path);
                        dispatch({
                            type: "drag",
                            drag: {
                                paths: together
                                    ? visible.filter((path) =>
                                          state.selection.includes(path),
                                      )
                                    : [node.path],
                                over: null,
                            },
                        });
                    }}
                    onDragEnd={() => dispatch({ type: "drag", drag: null })}
                    onClick={(event) => {
                        if (node.kind === "folder")
                            dispatch({
                                type: "toggle-folder",
                                path: node.path,
                            });
                        else if (event.ctrlKey || event.metaKey)
                            dispatch({
                                type: "select",
                                path: node.path,
                                mode: "toggle",
                                visible,
                            });
                        else if (event.shiftKey)
                            dispatch({
                                type: "select",
                                path: node.path,
                                mode: "range",
                                visible,
                            });
                        else dispatch({ type: "open-note", path: node.path });
                    }}
                    className={cn(
                        "flex h-tree-row min-w-none flex-1 items-center gap-in-group rounded-control pl-in-group pr-between-groups text-left text-size-ui motion-feedback hover:bg-state-hover focus-visible:focus-ring-inset",
                        selected
                            ? "text-text-note hover:bg-transparent"
                            : "text-text-ui",
                    )}
                >
                    {node.kind === "folder" ? (
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
                    <span className="truncate">{node.name}</span>
                </button>
            </div>
            {node.kind === "folder" && expanded ? (
                <ul
                    role="group"
                    className="m-none ml-between-groups list-none border-l border-border-divider p-none"
                >
                    {node.children.length === 0 ? (
                        <li
                            role="none"
                            className="flex h-tree-row items-center px-between-groups text-size-ui-small text-text-muted"
                        >
                            Empty folder
                        </li>
                    ) : (
                        node.children.map((child) => (
                            <Row
                                key={child.path}
                                node={child}
                                depthKey={child.path}
                                openMenu={openMenu}
                                visible={visible}
                            />
                        ))
                    )}
                </ul>
            ) : null}
        </li>
    );
}

export function FolderTree() {
    const { state, dispatch } = useStore();
    const files = listedFiles(state);
    const tree = buildTree(files);
    const listRef = useRef<HTMLUListElement>(null);
    const rootDrop = state.drag?.over === "";
    const [menu, setMenu] = useState<{
        path: string;
        kind: MenuKind;
        x: number;
        y: number;
    } | null>(null);
    const visible = visibleNotes(tree, state.expanded);
    const selectedPaths = visible.filter((path) =>
        state.selection.includes(path),
    );
    const openMenu: OpenMenu = (path, kind, x, y) => {
        let menuKind = kind;
        if (kind === "note") {
            if (selectedPaths.length > 1 && selectedPaths.includes(path))
                menuKind = "selection";
            else if (
                state.selection.length > 0 &&
                !state.selection.includes(path)
            )
                dispatch({ type: "clear-selection" });
        }
        dispatch({ type: "menu-open", path });
        setMenu({ path, kind: menuKind, x, y });
    };
    const presetPath = state.menuFor;
    useLayoutEffect(() => {
        if (presetPath === null) return;
        const row = listRef.current?.querySelector<HTMLElement>(
            `[data-path="${CSS.escape(presetPath)}"]`,
        );
        const rect = row?.getBoundingClientRect();
        if (rect)
            setMenu({
                path: presetPath,
                kind: files[presetPath]?.kind === "note" ? "note" : "folder",
                x: rect.left + 24,
                y: rect.bottom,
            });
    }, [presetPath]);
    const restoreFocus = () => {
        if (!menu) return;
        listRef.current
            ?.querySelector<HTMLElement>(
                `[data-path="${CSS.escape(menu.path)}"]`,
            )
            ?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
        if (!event.currentTarget.contains(event.target as Node)) return;
        const items = Array.from(
            listRef.current?.querySelectorAll<HTMLButtonElement>(
                '[role="treeitem"]',
            ) ?? [],
        );
        const current = items.indexOf(
            document.activeElement as HTMLButtonElement,
        );
        const path = (document.activeElement as HTMLElement | null)?.dataset
            .path;
        if (
            path &&
            ((event.key === "F10" && event.shiftKey) ||
                event.key === "ContextMenu")
        ) {
            const rect = (
                document.activeElement as HTMLElement
            ).getBoundingClientRect();
            openMenu(
                path,
                files[path]?.kind === "note" ? "note" : "folder",
                rect.left + 24,
                rect.bottom,
            );
        } else if (
            event.shiftKey &&
            path &&
            files[path]?.kind === "note" &&
            (event.key === "ArrowDown" || event.key === "ArrowUp")
        ) {
            const next = items[current + (event.key === "ArrowDown" ? 1 : -1)];
            const nextPath = next?.dataset.path;
            if (!next || !nextPath || files[nextPath]?.kind !== "note") return;
            if (state.selection.length === 0)
                dispatch({ type: "select", path, mode: "set", visible });
            dispatch({
                type: "select",
                path: nextPath,
                mode: "range",
                visible,
            });
            next.focus();
        } else if (event.key === "Escape" && state.selection.length > 0)
            dispatch({ type: "clear-selection" });
        else if (event.key === "ArrowDown") items[current + 1]?.focus();
        else if (event.key === "ArrowUp") items[current - 1]?.focus();
        else if (event.key === "Home") items[0]?.focus();
        else if (event.key === "End") items[items.length - 1]?.focus();
        else if (
            event.key === "ArrowRight" &&
            path &&
            files[path]?.kind === "folder" &&
            !state.expanded.includes(path)
        )
            dispatch({ type: "toggle-folder", path });
        else if (
            event.key === "ArrowLeft" &&
            path &&
            state.expanded.includes(path)
        )
            dispatch({ type: "toggle-folder", path });
        else return;
        event.preventDefault();
    };

    return (
        <div
            data-gap="DSG-02"
            onContextMenu={(event) => {
                event.preventDefault();
                openMenu("", "root", event.clientX, event.clientY);
            }}
            className="group flex min-h-full flex-col p-in-group"
        >
            <div
                onDragOver={(event) => {
                    if (!state.drag) return;
                    event.preventDefault();
                    if (state.drag.over !== "")
                        dispatch({
                            type: "drag",
                            drag: { ...state.drag, over: "" },
                        });
                }}
                onDrop={(event) => {
                    if (!state.drag) return;
                    event.preventDefault();
                    dispatch({ type: "move", paths: state.drag.paths, to: "" });
                }}
                className={cn(
                    "flex h-tree-row items-center rounded-control pl-between-groups",
                    rootDrop && "bg-state-selected",
                )}
            >
                <span className="truncate text-size-ui-small text-text-muted">
                    Workspace folder
                </span>
            </div>
            {tree.length === 0 ? null : (
                <ul
                    ref={listRef}
                    role="tree"
                    aria-label="Notes"
                    aria-multiselectable="true"
                    onKeyDown={handleKeyDown}
                    className="m-none list-none p-none"
                >
                    {tree.map((node) => (
                        <Row
                            key={node.path}
                            node={node}
                            depthKey={node.path}
                            openMenu={openMenu}
                            visible={visible}
                        />
                    ))}
                </ul>
            )}
            {menu ? (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    label={
                        menu.kind === "root"
                            ? "Workspace actions"
                            : menu.kind === "selection"
                              ? `Actions for ${selectedPaths.length} notes`
                              : `Actions for ${menu.kind === "note" ? noteName(menu.path) : baseName(menu.path)}`
                    }
                    items={menuItems(
                        menu.path,
                        menu.kind,
                        dispatch,
                        selectedPaths,
                    )}
                    onClose={() => setMenu(null)}
                    onRestoreFocus={restoreFocus}
                />
            ) : null}
        </div>
    );
}
