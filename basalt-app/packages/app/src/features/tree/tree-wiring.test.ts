import { toWorkspacePath } from "@basalt/core";
import { describe, expect, it } from "vitest";
import { createNotesStore } from "../notes/notes-store";
import { connectTreeStore } from "./tree-wiring";
import { createTreeStore, toggleFolder, toggleSelected } from "./tree-store";

function path(value: string) {
    const parsed = toWorkspacePath(value);
    if (!parsed.ok) throw new Error(value);
    return parsed.value;
}

function setup() {
    const tree = createTreeStore();
    const notes = createNotesStore();
    const stop = connectTreeStore({ tree, notes });
    return { tree, notes, stop };
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

    it("stops reacting after the returned unsubscribe", () => {
        const { tree, notes, stop } = setup();
        stop();
        notes.setState({ activeNote: path("a/c.md") });
        expect(tree.getState().expanded.size).toBe(0);
    });

    it("drops selected notes that leave the notes list and keeps the rest", () => {
        const { tree, notes } = setup();
        notes.setState({
            notes: [
                { path: path("a.md"), name: "a" },
                { path: path("b.md"), name: "b" },
            ],
        });
        toggleSelected(tree, "a.md");
        toggleSelected(tree, "b.md");

        notes.setState({ notes: [{ path: path("b.md"), name: "b" }] });

        expect([...tree.getState().selected]).toEqual(["b.md"]);
    });

    it("leaves the selection alone when the notes list is unchanged", () => {
        const { tree, notes } = setup();
        toggleSelected(tree, "gone.md");

        notes.setState({ listError: null });

        expect([...tree.getState().selected]).toEqual(["gone.md"]);
    });
});
