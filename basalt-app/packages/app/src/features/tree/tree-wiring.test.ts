import { toWorkspacePath } from "@basalt/core";
import { describe, expect, it } from "vitest";
import { createNotesStore } from "../notes/notes-store";
import { createWorkspaceStore } from "../workspace/workspace-store";
import { connectTreeStore } from "./tree-wiring";
import { createTreeStore, toggleFolder } from "./tree-store";

function path(value: string) {
    const parsed = toWorkspacePath(value);
    if (!parsed.ok) throw new Error(value);
    return parsed.value;
}

function setup() {
    const tree = createTreeStore();
    const notes = createNotesStore();
    const workspace = createWorkspaceStore();
    const stop = connectTreeStore({ tree, notes, workspace });
    return { tree, notes, workspace, stop };
}

describe("connectTreeStore", () => {
    it("expands the folders of a note when it becomes active", () => {
        const { tree, notes } = setup();

        notes.setState({ activeNote: path("a/b/c.md") });

        expect([...tree.getState().expanded].sort()).toEqual(["a", "a/b"]);
    });

    it("keeps other folders expanded and does not re-expand on unrelated changes", () => {
        const { tree, notes } = setup();
        notes.setState({ activeNote: path("a/c.md") });
        toggleFolder(tree, "a");
        expect(tree.getState().expanded.has("a")).toBe(false);

        notes.setState({ listError: null });

        expect(tree.getState().expanded.has("a")).toBe(false);
    });

    it("does nothing for a root note or no active note", () => {
        const { tree, notes } = setup();
        notes.setState({ activeNote: path("root.md") });
        notes.setState({ activeNote: null });
        expect(tree.getState().expanded.size).toBe(0);
    });

    it("resets the tree state when the workspace root changes", () => {
        const { tree, workspace } = setup();
        toggleFolder(tree, "a");

        workspace.setState({ root: "/other" as never });

        expect(tree.getState().expanded.size).toBe(0);
    });

    it("stops reacting after the returned unsubscribe", () => {
        const { tree, notes, stop } = setup();
        stop();
        notes.setState({ activeNote: path("a/c.md") });
        expect(tree.getState().expanded.size).toBe(0);
    });
});
