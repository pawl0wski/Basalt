import { toWorkspacePath } from "@basalt/core";
import { describe, expect, it } from "vitest";
import {
    closeDialog,
    closeMenu,
    createTreeStore,
    expandFolders,
    openMenu,
    openNewFolderDialog,
    openRenameDialog,
    setDialogError,
    setDialogName,
    setDialogPending,
    setFocusedRow,
    toggleFolder,
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
