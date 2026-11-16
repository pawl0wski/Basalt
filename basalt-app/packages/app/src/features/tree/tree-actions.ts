import type { WorkspacePath } from "@basalt/core";
import type { NotesActions } from "../notes/notes-actions";
import type { NotesStore } from "../notes/notes-store";
import { validateEntryName } from "./entry-name";
import {
    ancestorFolders,
    childrenOf,
    findTreeNode,
    parentFolder,
} from "./tree-nodes";
import {
    closeDialog,
    endDrag,
    setDropTarget,
    startDrag,
    type DropTarget,
    closeMenu,
    expandFolders,
    openMenu,
    openNewFolderDialog,
    openRenameDialog,
    setDialogError,
    setDialogName,
    setDialogPending,
    setFocusedRow,
    toggleFolder,
    type TreeStore,
} from "./tree-store";

export type TreeActions = {
    toggleFolder(id: string): void;
    focusRow(id: string): void;
    requestMenu(id: string | null, point: { x: number; y: number }): void;
    closeMenu(): void;
    newNote(parent: WorkspacePath | null): Promise<void>;
    startRename(path: WorkspacePath): void;
    startNewFolder(parent: WorkspacePath | null): void;
    setName(name: string): void;
    cancelDialog(): void;
    submitDialog(): Promise<void>;
    dragStart(id: string): void;
    dragEnd(): void;
    dropTargetChange(target: DropTarget | null): void;
    hoverOpen(id: string): void;
    drop(target: DropTarget): Promise<void>;
};

export function createTreeActions(options: {
    readonly store: TreeStore;
    readonly notesStore: NotesStore;
    readonly notes: NotesActions;
}): TreeActions {
    const { store, notesStore, notes } = options;

    function currentTree() {
        return notesStore.getState().tree;
    }

    async function submitRename(
        path: WorkspacePath,
        name: string,
    ): Promise<void> {
        const parent = parentFolder(path);
        const problem = validateEntryName({
            name,
            kind: "note",
            parent,
            siblings: childrenOf(currentTree(), parent),
            own: path,
        });
        if (problem !== null || name === "") return;
        setDialogPending(store, true);
        const renamed = await notes.renameNote(path, name);
        if (!renamed.ok) {
            setDialogError(store, renamed.error.code);
            return;
        }
        setFocusedRow(store, renamed.value);
        closeDialog(store);
    }

    async function submitNewFolder(
        parent: WorkspacePath | null,
        name: string,
    ): Promise<void> {
        const problem = validateEntryName({
            name,
            kind: "folder",
            parent,
            siblings: childrenOf(currentTree(), parent),
        });
        if (problem !== null || name === "") return;
        setDialogPending(store, true);
        const created = await notes.createFolder(parent, name);
        if (!created.ok) {
            setDialogError(store, created.error.code);
            return;
        }
        expandFolders(store, [
            ...ancestorFolders(created.value),
            created.value,
        ]);
        setFocusedRow(store, created.value);
        closeDialog(store);
    }

    function destinationOf(target: DropTarget): WorkspacePath | null | false {
        if (target.type === "root") return null;
        const node = findTreeNode(currentTree(), target.id);
        return node?.kind === "folder" ? node.path : false;
    }

    function changesFolder(
        paths: Iterable<string>,
        destination: WorkspacePath | null,
    ): boolean {
        return [...paths].some(
            (path) => parentFolder(path as WorkspacePath) !== destination,
        );
    }

    return {
        dragStart: (id) => {
            startDrag(store, new Set([id]));
        },
        dragEnd: () => {
            endDrag(store);
        },
        dropTargetChange(target) {
            const { dragging } = store.getState();
            if (dragging.size === 0 || target === null) {
                setDropTarget(store, null);
                return;
            }
            const destination = destinationOf(target);
            setDropTarget(
                store,
                destination !== false && changesFolder(dragging, destination)
                    ? target
                    : null,
            );
        },
        hoverOpen(id) {
            if (store.getState().dragging.size === 0) return;
            expandFolders(store, [id]);
        },
        async drop(target) {
            const paths = [...store.getState().dragging] as WorkspacePath[];
            endDrag(store);
            const destination = destinationOf(target);
            if (destination === false || !changesFolder(paths, destination))
                return;
            const moved = await notes.moveNotes(paths, destination);
            if (!moved.ok || moved.value.length === 0) return;
            if (destination !== null)
                expandFolders(store, [
                    ...ancestorFolders(destination),
                    destination,
                ]);
            setFocusedRow(store, moved.value[moved.value.length - 1].to);
        },
        toggleFolder: (id) => {
            toggleFolder(store, id);
        },
        focusRow: (id) => {
            setFocusedRow(store, id);
        },
        requestMenu(id, point) {
            if (id === null) {
                openMenu(store, { target: { kind: "root" }, point });
                return;
            }
            const node = findTreeNode(currentTree(), id);
            if (!node) return;
            setFocusedRow(store, id);
            openMenu(store, {
                target: { kind: node.kind, path: node.path },
                point,
            });
        },
        closeMenu: () => {
            closeMenu(store);
        },
        async newNote(parent) {
            closeMenu(store);
            await notes.createNote({ folder: parent });
        },
        startRename(path) {
            const node = findTreeNode(currentTree(), path);
            if (node?.kind !== "note") return;
            openRenameDialog(store, path, node.name);
        },
        startNewFolder(parent) {
            openNewFolderDialog(store, parent);
        },
        setName: (name) => {
            setDialogName(store, name);
        },
        cancelDialog: () => {
            closeDialog(store);
        },
        async submitDialog() {
            const { dialog } = store.getState();
            if (!dialog || dialog.pending) return;
            if (dialog.kind === "rename") {
                const node = findTreeNode(currentTree(), dialog.path);
                if (node?.kind === "note" && node.name === dialog.name) {
                    closeDialog(store);
                    return;
                }
                await submitRename(dialog.path, dialog.name);
            } else {
                await submitNewFolder(dialog.parent, dialog.name);
            }
        },
    };
}
