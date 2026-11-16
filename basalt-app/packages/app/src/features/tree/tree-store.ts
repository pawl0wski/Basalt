import type { AppErrorCode, WorkspacePath } from "@basalt/core";
import { createStore, type StoreApi } from "zustand/vanilla";

export type MenuTarget =
    | { readonly kind: "root" }
    | { readonly kind: "folder"; readonly path: WorkspacePath }
    | { readonly kind: "note"; readonly path: WorkspacePath };

export type TreeMenu = {
    readonly target: MenuTarget;
    readonly point: { readonly x: number; readonly y: number };
};

type DialogFields = {
    readonly name: string;
    readonly pending: boolean;
    readonly error: AppErrorCode | null;
};

export type TreeDialog =
    | (DialogFields & { readonly kind: "rename"; readonly path: WorkspacePath })
    | (DialogFields & {
          readonly kind: "new-folder";
          readonly parent: WorkspacePath | null;
      });

export type DropTarget =
    | { readonly type: "root" }
    | { readonly type: "folder"; readonly id: string };

export type TreeConfirm = {
    readonly kind: "delete";
    readonly paths: readonly WorkspacePath[];
    readonly pending: boolean;
    readonly error: AppErrorCode | null;
};

export type TreeState = {
    readonly expanded: ReadonlySet<string>;
    readonly focusedId: string | null;
    readonly selected: ReadonlySet<string>;
    readonly anchorId: string | null;
    readonly dragging: ReadonlySet<string>;
    readonly dropTarget: DropTarget | null;
    readonly menu: TreeMenu | null;
    readonly dialog: TreeDialog | null;
    readonly confirm: TreeConfirm | null;
};

export type TreeStore = StoreApi<TreeState>;

export function emptyTreeState(): TreeState {
    return {
        expanded: new Set(),
        focusedId: null,
        selected: new Set(),
        anchorId: null,
        dragging: new Set(),
        dropTarget: null,
        menu: null,
        dialog: null,
        confirm: null,
    };
}

export function createTreeStore(): TreeStore {
    return createStore<TreeState>(() => emptyTreeState());
}

export function toggleFolder(store: TreeStore, id: string): void {
    store.setState(({ expanded }) => {
        const next = new Set(expanded);
        if (!next.delete(id)) next.add(id);
        return { expanded: next };
    });
}

export function expandFolders(store: TreeStore, ids: readonly string[]): void {
    const { expanded } = store.getState();
    if (ids.every((id) => expanded.has(id))) return;
    store.setState({ expanded: new Set([...expanded, ...ids]) });
}

export function setFocusedRow(store: TreeStore, id: string | null): void {
    if (store.getState().focusedId === id) return;
    store.setState({ focusedId: id });
}

export function openMenu(store: TreeStore, menu: TreeMenu): void {
    store.setState({ menu });
}

export function closeMenu(store: TreeStore): void {
    if (store.getState().menu === null) return;
    store.setState({ menu: null });
}

export function openRenameDialog(
    store: TreeStore,
    path: WorkspacePath,
    name: string,
): void {
    store.setState({
        menu: null,
        dialog: { kind: "rename", path, name, pending: false, error: null },
    });
}

export function openNewFolderDialog(
    store: TreeStore,
    parent: WorkspacePath | null,
): void {
    store.setState({
        menu: null,
        dialog: {
            kind: "new-folder",
            parent,
            name: "",
            pending: false,
            error: null,
        },
    });
}

export function setDialogName(store: TreeStore, name: string): void {
    const { dialog } = store.getState();
    if (!dialog || dialog.pending) return;
    store.setState({ dialog: { ...dialog, name, error: null } });
}

export function setDialogPending(store: TreeStore, pending: boolean): void {
    const { dialog } = store.getState();
    if (!dialog) return;
    store.setState({
        dialog: { ...dialog, pending, error: pending ? null : dialog.error },
    });
}

export function setDialogError(
    store: TreeStore,
    error: AppErrorCode | null,
): void {
    const { dialog } = store.getState();
    if (!dialog) return;
    store.setState({ dialog: { ...dialog, pending: false, error } });
}

export function closeDialog(store: TreeStore): void {
    if (store.getState().dialog === null) return;
    store.setState({ dialog: null });
}

export function openDeleteConfirm(
    store: TreeStore,
    paths: readonly WorkspacePath[],
): void {
    store.setState({
        menu: null,
        confirm: { kind: "delete", paths, pending: false, error: null },
    });
}

export function closeConfirm(store: TreeStore): void {
    if (store.getState().confirm === null) return;
    store.setState({ confirm: null });
}

export function setConfirmPending(store: TreeStore, pending: boolean): void {
    const { confirm } = store.getState();
    if (!confirm) return;
    store.setState({
        confirm: { ...confirm, pending, error: pending ? null : confirm.error },
    });
}

export function setConfirmError(
    store: TreeStore,
    error: AppErrorCode | null,
): void {
    const { confirm } = store.getState();
    if (!confirm) return;
    store.setState({ confirm: { ...confirm, pending: false, error } });
}

export function startDrag(store: TreeStore, ids: ReadonlySet<string>): void {
    store.setState({ dragging: ids, dropTarget: null, menu: null });
}

export function endDrag(store: TreeStore): void {
    const { dragging, dropTarget } = store.getState();
    if (dragging.size === 0 && dropTarget === null) return;
    store.setState({ dragging: new Set(), dropTarget: null });
}

export function sameDropTarget(
    a: DropTarget | null,
    b: DropTarget | null,
): boolean {
    if (a === null || b === null) return a === b;
    if (a.type === "root") return b.type === "root";
    return b.type === "folder" && a.id === b.id;
}

export function setDropTarget(
    store: TreeStore,
    target: DropTarget | null,
): void {
    if (sameDropTarget(store.getState().dropTarget, target)) return;
    store.setState({ dropTarget: target });
}

export function setSelection(
    store: TreeStore,
    selected: ReadonlySet<string>,
    anchorId: string | null,
): void {
    store.setState({ selected, anchorId });
}

export function clearSelection(store: TreeStore): void {
    const { selected, anchorId } = store.getState();
    if (selected.size === 0 && anchorId === null) return;
    store.setState({ selected: new Set(), anchorId: null });
}

export function toggleSelected(store: TreeStore, id: string): void {
    const next = new Set(store.getState().selected);
    if (!next.delete(id)) next.add(id);
    store.setState({ selected: next, anchorId: id });
}

export function selectRange(
    store: TreeStore,
    id: string,
    anchorId: string | null,
    visibleNoteIds: readonly string[],
): void {
    const from = anchorId === null ? -1 : visibleNoteIds.indexOf(anchorId);
    const to = visibleNoteIds.indexOf(id);
    if (to === -1) return;
    if (from === -1) {
        store.setState({ selected: new Set([id]), anchorId: id });
        return;
    }
    const [low, high] = from < to ? [from, to] : [to, from];
    store.setState({
        selected: new Set(visibleNoteIds.slice(low, high + 1)),
        anchorId: visibleNoteIds[from],
    });
}

export function pruneSelection(
    store: TreeStore,
    exists: (id: string) => boolean,
): void {
    const { selected, anchorId } = store.getState();
    const kept = [...selected].filter(exists);
    const anchor = anchorId !== null && exists(anchorId) ? anchorId : null;
    if (kept.length === selected.size && anchor === anchorId) return;
    store.setState({ selected: new Set(kept), anchorId: anchor });
}
