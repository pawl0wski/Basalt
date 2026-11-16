import { toWorkspacePath } from "@basalt/core";
import { describe, expect, it } from "vitest";
import {
    closeDialog,
    clearSelection,
    closeMenu,
    createTreeStore,
    endDrag,
    expandFolders,
    openMenu,
    openNewFolderDialog,
    openRenameDialog,
    pruneSelection,
    selectRange,
    setDialogError,
    setDialogName,
    setDialogPending,
    setDropTarget,
    setFocusedRow,
    startDrag,
    toggleFolder,
    toggleSelected,
} from "./tree-store";

function path(value: string) {
    const parsed = toWorkspacePath(value);
    if (!parsed.ok) throw new Error(value);
    return parsed.value;
}

describe("expansion", () => {
    it("starts collapsed and toggles a folder open and closed", () => {
        const store = createTreeStore();
        expect(store.getState().expanded.size).toBe(0);

        toggleFolder(store, "a");
        expect(store.getState().expanded.has("a")).toBe(true);

        toggleFolder(store, "a");
        expect(store.getState().expanded.has("a")).toBe(false);
    });

    it("expands folders without collapsing others and keeps the same state when nothing changes", () => {
        const store = createTreeStore();
        toggleFolder(store, "a");
        expandFolders(store, ["a", "a/b"]);
        const before = store.getState();

        expect([...before.expanded].sort()).toEqual(["a", "a/b"]);
        expandFolders(store, ["a/b"]);
        expect(store.getState()).toBe(before);
    });

    it("replaces the set so subscribers see a new value", () => {
        const store = createTreeStore();
        const first = store.getState().expanded;
        toggleFolder(store, "a");
        expect(store.getState().expanded).not.toBe(first);
        expect(first.size).toBe(0);
    });
});

describe("focus and menu", () => {
    it("records the focused row", () => {
        const store = createTreeStore();
        setFocusedRow(store, "a.md");
        expect(store.getState().focusedId).toBe("a.md");
    });

    it("opens and closes the context menu for a target", () => {
        const store = createTreeStore();
        openMenu(store, {
            target: { kind: "note", path: path("a.md") },
            point: { x: 4, y: 8 },
        });
        expect(store.getState().menu).toEqual({
            target: { kind: "note", path: "a.md" },
            point: { x: 4, y: 8 },
        });

        closeMenu(store);
        expect(store.getState().menu).toBeNull();
    });
});

describe("dialogs", () => {
    it("opens the rename dialog with the current name and closes the menu", () => {
        const store = createTreeStore();
        openMenu(store, { target: { kind: "root" }, point: { x: 0, y: 0 } });

        openRenameDialog(store, path("a/b.md"), "b");

        expect(store.getState().menu).toBeNull();
        expect(store.getState().dialog).toEqual({
            kind: "rename",
            path: "a/b.md",
            name: "b",
            pending: false,
            error: null,
        });
    });

    it("opens the new-folder dialog for a parent or the root with an empty name", () => {
        const store = createTreeStore();
        openNewFolderDialog(store, path("a"));
        expect(store.getState().dialog).toMatchObject({
            kind: "new-folder",
            parent: "a",
            name: "",
        });

        openNewFolderDialog(store, null);
        expect(store.getState().dialog).toMatchObject({ parent: null });
    });

    it("clears the error when the name changes and ignores edits while pending", () => {
        const store = createTreeStore();
        openNewFolderDialog(store, null);
        setDialogName(store, "x");
        setDialogError(store, "already-exists");
        expect(store.getState().dialog).toMatchObject({
            error: "already-exists",
        });

        setDialogName(store, "xy");
        expect(store.getState().dialog).toMatchObject({
            name: "xy",
            error: null,
        });

        setDialogPending(store, true);
        setDialogName(store, "changed");
        expect(store.getState().dialog).toMatchObject({
            name: "xy",
            pending: true,
        });
    });

    it("setting an error ends the pending state and close removes the dialog", () => {
        const store = createTreeStore();
        openNewFolderDialog(store, null);
        setDialogPending(store, true);

        setDialogError(store, "permission-denied");
        expect(store.getState().dialog).toMatchObject({
            pending: false,
            error: "permission-denied",
        });

        closeDialog(store);
        expect(store.getState().dialog).toBeNull();
    });

    it("dialog helpers do nothing when no dialog is open", () => {
        const store = createTreeStore();
        const before = store.getState();
        setDialogName(store, "x");
        setDialogPending(store, true);
        setDialogError(store, "unknown");
        closeDialog(store);
        expect(store.getState()).toBe(before);
    });
});

describe("drag state", () => {
    it("starts with the dragged ids, closes the menu and clears the drop target", () => {
        const store = createTreeStore();
        openMenu(store, {
            target: { kind: "root" },
            point: { x: 0, y: 0 },
        });
        setDropTarget(store, { type: "root" });

        startDrag(store, new Set(["a.md"]));

        expect(store.getState()).toMatchObject({
            dragging: new Set(["a.md"]),
            dropTarget: null,
            menu: null,
        });
    });

    it("ends the drag and clears both the ids and the drop target", () => {
        const store = createTreeStore();
        startDrag(store, new Set(["a.md"]));
        setDropTarget(store, { type: "folder", id: "d" });

        endDrag(store);

        expect(store.getState().dragging.size).toBe(0);
        expect(store.getState().dropTarget).toBeNull();
    });

    it("ending without a drag leaves the state object untouched", () => {
        const store = createTreeStore();
        const before = store.getState();
        endDrag(store);
        expect(store.getState()).toBe(before);
    });

    it("does not replace the state for an equal drop target but does for a different one", () => {
        const store = createTreeStore();
        setDropTarget(store, { type: "folder", id: "d" });
        const first = store.getState();

        setDropTarget(store, { type: "folder", id: "d" });
        expect(store.getState()).toBe(first);

        setDropTarget(store, { type: "folder", id: "e" });
        expect(store.getState().dropTarget).toEqual({
            type: "folder",
            id: "e",
        });
        setDropTarget(store, { type: "root" });
        expect(store.getState().dropTarget).toEqual({ type: "root" });
        setDropTarget(store, null);
        expect(store.getState().dropTarget).toBeNull();
    });
});

describe("selection", () => {
    const visible = ["a.md", "b.md", "c.md", "d.md"];

    it("toggles a note in and out and remembers the last toggled note as anchor", () => {
        const store = createTreeStore();

        toggleSelected(store, "a.md");
        toggleSelected(store, "c.md");
        expect([...store.getState().selected]).toEqual(["a.md", "c.md"]);
        expect(store.getState().anchorId).toBe("c.md");

        toggleSelected(store, "a.md");
        expect([...store.getState().selected]).toEqual(["c.md"]);
    });

    it("selects the notes between the anchor and the target in either direction", () => {
        const store = createTreeStore();

        selectRange(store, "c.md", "a.md", visible);
        expect([...store.getState().selected]).toEqual([
            "a.md",
            "b.md",
            "c.md",
        ]);
        expect(store.getState().anchorId).toBe("a.md");

        selectRange(store, "a.md", "c.md", visible);
        expect([...store.getState().selected]).toEqual([
            "a.md",
            "b.md",
            "c.md",
        ]);
        expect(store.getState().anchorId).toBe("c.md");
    });

    it("replaces the previous range so extending back shrinks it", () => {
        const store = createTreeStore();
        selectRange(store, "d.md", "a.md", visible);

        selectRange(store, "b.md", "a.md", visible);

        expect([...store.getState().selected]).toEqual(["a.md", "b.md"]);
    });

    it("selects only the target when there is no anchor or the anchor is not visible", () => {
        const store = createTreeStore();

        selectRange(store, "b.md", null, visible);
        expect([...store.getState().selected]).toEqual(["b.md"]);
        expect(store.getState().anchorId).toBe("b.md");

        selectRange(store, "c.md", "hidden/x.md", visible);
        expect([...store.getState().selected]).toEqual(["c.md"]);
    });

    it("ignores a target that is not a visible note", () => {
        const store = createTreeStore();
        toggleSelected(store, "a.md");
        const before = store.getState();

        selectRange(store, "folder", "a.md", visible);

        expect(store.getState()).toBe(before);
    });

    it("clears the selection and the anchor, and leaves an empty state untouched", () => {
        const store = createTreeStore();
        const empty = store.getState();
        clearSelection(store);
        expect(store.getState()).toBe(empty);

        toggleSelected(store, "a.md");
        clearSelection(store);

        expect(store.getState().selected.size).toBe(0);
        expect(store.getState().anchorId).toBeNull();
    });

    it("prunes notes that no longer exist and the anchor with them", () => {
        const store = createTreeStore();
        toggleSelected(store, "a.md");
        toggleSelected(store, "b.md");

        pruneSelection(store, (id) => id === "a.md");

        expect([...store.getState().selected]).toEqual(["a.md"]);
        expect(store.getState().anchorId).toBeNull();
    });

    it("prune keeps the same state when everything still exists", () => {
        const store = createTreeStore();
        toggleSelected(store, "a.md");
        const before = store.getState();

        pruneSelection(store, () => true);

        expect(store.getState()).toBe(before);
    });
});
