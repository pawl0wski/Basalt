import type { AppError, WorkspacePath } from "@basalt/core";
import { errorSurface } from "../feedback/error-surface";
import type { Feedback } from "../feedback/feedback";
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
    clearSelection,
    closeConfirm,
    closeDialog,
    openDeleteConfirm,
    pruneSelection,
    selectRange,
    setSelection,
    toggleSelected,
    endDrag,
    setDropTarget,
    startDrag,
    type DropTarget,
    closeMenu,
    expandFolders,
    prunePaths,
    remapPaths,
    openMenu,
    openNewFolderDialog,
    openRenameDialog,
    setDialogError,
    setDialogName,
    setDialogPending,
    setFocusedRow,
    toggleFolder,
    type TreeDialog,
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
    changeSelection(change: SelectionChange): void;
    clearSelection(): void;
    openNote(path: WorkspacePath): Promise<void>;
    requestDelete(paths: readonly WorkspacePath[]): void;
    confirmDelete(): Promise<void>;
    cancelConfirm(): void;
};

export type SelectionChange = {
    readonly mode: "toggle" | "range" | "extend";
    readonly id: string;
    readonly visibleNoteIds: readonly string[];
};

export function createTreeActions(options: {
    readonly store: TreeStore;
    readonly notesStore: NotesStore;
    readonly notes: NotesActions;
    readonly feedback: Feedback;
    readonly onDeleteFolderBlocked: (
        path: WorkspacePath,
        error: AppError,
    ) => void;
}): TreeActions {
    const { store, notesStore, notes, feedback, onDeleteFolderBlocked } =
        options;

    function failDialog(dialog: TreeDialog | null, error: AppError): void {
        const showToast = errorSurface(error) === "toast";
        if (showToast) feedback.report(error);
        if (store.getState().dialog !== dialog) return;
        if (showToast) closeDialog(store);
        else setDialogError(store, error.code);
    }

    function currentTree() {
        return notesStore.getState().tree;
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

    function draggedFolder(): WorkspacePath | null {
        const { dragging } = store.getState();
        if (dragging.size !== 1) return null;
        const [id] = [...dragging];
        const node = findTreeNode(currentTree(), id);
        return node?.kind === "folder" ? node.path : null;
    }

    function intoItself(
        folder: WorkspacePath,
        destination: WorkspacePath | null,
    ) {
        return (
            destination !== null &&
            (destination === folder || destination.startsWith(`${folder}/`))
        );
    }

    return {
        dragStart: (id) => {
            if (findTreeNode(currentTree(), id)?.kind === "folder") {
                clearSelection(store);
                startDrag(store, new Set([id]));
                return;
            }
            const { selected } = store.getState();
            if (!selected.has(id)) clearSelection(store);
            startDrag(store, selected.has(id) ? selected : new Set([id]));
        },
        changeSelection(change) {
            const { anchorId, focusedId } = store.getState();
            if (change.mode === "toggle") {
                toggleSelected(store, change.id);
                return;
            }
            const fallback =
                change.mode === "extend" &&
                focusedId !== null &&
                change.visibleNoteIds.includes(focusedId)
                    ? focusedId
                    : (notesStore.getState().activeNote ?? null);
            selectRange(
                store,
                change.id,
                anchorId ?? fallback,
                change.visibleNoteIds,
            );
        },
        clearSelection: () => {
            clearSelection(store);
        },
        async openNote(path) {
            clearSelection(store);
            await notes.openNote(path, { focus: true });
        },
        requestDelete(paths) {
            openDeleteConfirm(store, paths);
        },
        cancelConfirm() {
            closeConfirm(store);
        },
        async confirmDelete() {
            const { confirm } = store.getState();
            if (!confirm) return;
            const paths = confirm.paths;
            closeConfirm(store);
            const folder =
                paths.length === 1
                    ? findTreeNode(currentTree(), paths[0])
                    : null;
            if (folder?.kind === "folder") {
                const deleted = await notes.deleteFolder(folder.path);
                if (deleted.ok) {
                    prunePaths(store, folder.path);
                    notesStore.setState({ createError: null });
                    return;
                }
                if (deleted.error.detail?.kind === "flush-failed") {
                    onDeleteFolderBlocked(folder.path, deleted.error);
                    return;
                }
                feedback.report(deleted.error);
                return;
            }
            const result = await notes.deleteNotes(paths);
            const existing = new Set<string>(
                notesStore.getState().notes.map((note) => note.path),
            );
            pruneSelection(store, (id) => existing.has(id));
            if (!result.ok) {
                feedback.report(result.error);
                return;
            }
            const { deleted, failed } = result.value;
            if (failed.length === 0) {
                notesStore.setState({ createError: null });
                return;
            }
            feedback.report(
                deleted.length === 0
                    ? (failed[0]?.error ?? {
                          code: "unknown",
                          message: "The notes were not deleted.",
                      })
                    : {
                          code: failed[0]?.error.code ?? "unknown",
                          message: "Some notes were not deleted.",
                          detail: {
                              kind: "delete-failed",
                              failed: failed.length,
                              total: paths.length,
                          },
                      },
            );
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
            const folder = draggedFolder();
            setDropTarget(
                store,
                destination !== false &&
                    changesFolder(dragging, destination) &&
                    (folder === null || !intoItself(folder, destination))
                    ? target
                    : null,
            );
        },
        hoverOpen(id) {
            if (store.getState().dragging.size === 0) return;
            expandFolders(store, [id]);
        },
        async drop(target) {
            const folder = draggedFolder();
            const paths = [...store.getState().dragging] as WorkspacePath[];
            const selected = store.getState().selected;
            endDrag(store);
            const destination = destinationOf(target);
            if (folder !== null) {
                if (
                    destination === false ||
                    !changesFolder(paths, destination) ||
                    intoItself(folder, destination)
                ) {
                    return;
                }
                const moved = await notes.moveFolder(folder, destination);
                const name = folder.slice(folder.lastIndexOf("/") + 1);
                const target =
                    `${destination === null ? "" : `${destination}/`}${name}` as WorkspacePath;
                const happened =
                    (moved.ok && moved.value !== null) ||
                    (!moved.ok &&
                        moved.error.detail?.kind === "folder-move-stopped");
                if (!happened) return;
                remapPaths(store, folder, target);
                if (destination !== null) {
                    expandFolders(store, [
                        ...ancestorFolders(destination),
                        destination,
                    ]);
                }
                setFocusedRow(store, target);
                return;
            }
            if (destination === false || !changesFolder(paths, destination))
                return;
            const moved = await notes.moveNotes(paths, destination);
            const moves = moved.ok ? moved.value : [];
            if (selected.size > 0) {
                const renamed = new Map<string, string>(
                    moves.map((move) => [move.from, move.to]),
                );
                const following = [...selected].map(
                    (id) => renamed.get(id) ?? id,
                );
                setSelection(store, new Set(following), following[0] ?? null);
                const existing = new Set<string>(
                    notesStore.getState().notes.map((note) => note.path),
                );
                pruneSelection(store, (id) => existing.has(id));
            }
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
            if (node.kind === "note") {
                const { selected } = store.getState();
                if (!selected.has(id)) clearSelection(store);
            }
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
            if (!node) return;
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
            const renaming = dialog.kind === "rename";
            const renamedNode = renaming
                ? findTreeNode(currentTree(), dialog.path)
                : null;
            if (renamedNode && renamedNode.name === dialog.name) {
                closeDialog(store);
                return;
            }

            const parent = renaming ? parentFolder(dialog.path) : dialog.parent;
            const problem = validateEntryName({
                name: dialog.name,
                kind: renamedNode?.kind ?? "folder",
                parent,
                siblings: childrenOf(currentTree(), parent),
                own: renaming ? dialog.path : undefined,
            });
            if (problem === "reserved") return;
            if (problem === "collision") {
                failDialog(dialog, {
                    code: "already-exists",
                    message: "An entry with this name already exists.",
                });
                return;
            }
            if (problem !== null || dialog.name === "") return;

            setDialogPending(store, true);
            const pendingDialog = store.getState().dialog;
            const result = !renaming
                ? await notes.createFolder(parent, dialog.name)
                : renamedNode?.kind === "folder"
                  ? await notes.renameFolder(dialog.path, dialog.name)
                  : await notes.applyTitle(dialog.path, dialog.name);
            if (!result.ok) {
                failDialog(pendingDialog, result.error);
                return;
            }
            if (store.getState().dialog !== pendingDialog) return;
            if (renaming && renamedNode?.kind === "folder") {
                remapPaths(store, dialog.path, result.value);
            }
            if (!renaming) {
                expandFolders(store, [
                    ...ancestorFolders(result.value),
                    result.value,
                ]);
            }
            setFocusedRow(store, result.value);
            closeDialog(store);
        },
    };
}
