import { describe, expect, it } from "vitest";
import { createHarness, root, seedFs, wsPath } from "../test-harness";
import { expandFolders, setSelection } from "./tree-store";

const A = root("/a");

async function open(
    files: Record<string, string>,
    options: Parameters<typeof seedFs>[1] = {},
) {
    const fs = seedFs(files, options);
    const h = createHarness({ workspaces: { [A]: fs }, picked: A });
    await h.workspaceActions.openWorkspace();
    return { h, fs };
}

async function paths(fs: ReturnType<typeof seedFs>) {
    const listed = await fs.list();
    return listed.ok ? listed.value.map((entry) => entry.path).sort() : [];
}

async function savedText(fs: ReturnType<typeof seedFs>, path: string) {
    const read = await fs.readText(wsPath(path));
    return read.ok ? read.value : null;
}

const state = (h: Awaited<ReturnType<typeof open>>["h"]) =>
    h.treeStore.getState();

describe("renaming a folder", () => {
    it("renames the directory, follows open tabs, and keeps the folder expanded and focused", async () => {
        const { h, fs } = await open({
            "docs/a.md": "A",
            "docs/deep/b.md": "B",
        });
        await h.notesActions.openNote(wsPath("docs/deep/b.md"));
        expandFolders(h.treeStore, ["docs", "docs/deep"]);
        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.setName("Papers");

        await h.treeActions.submitDialog();

        expect(await paths(fs)).toEqual([
            "Papers",
            "Papers/a.md",
            "Papers/deep",
            "Papers/deep/b.md",
        ]);
        expect(h.notesStore.getState().openNotes.map((n) => n.path)).toEqual([
            "Papers/deep/b.md",
        ]);
        expect(h.notesStore.getState().activeNote).toBe("Papers/deep/b.md");
        expect(state(h).dialog).toBeNull();
        expect(state(h).focusedId).toBe("Papers");
        expect([...state(h).expanded].sort()).toEqual([
            "Papers",
            "Papers/deep",
        ]);
    });

    it("flushes unsaved notes inside before renaming and keeps typing working", async () => {
        const { h, fs } = await open({ "docs/a.md": "base" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        h.notesActions.updateText(wsPath("docs/a.md"), "typed");
        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.setName("Papers");

        await h.treeActions.submitDialog();

        expect(await savedText(fs, "Papers/a.md")).toBe("typed");
        h.notesActions.updateText(wsPath("Papers/a.md"), "typed more");
        await h.notesActions.saveNow(wsPath("Papers/a.md"));
        expect(await savedText(fs, "Papers/a.md")).toBe("typed more");
    });

    it("cancels with the save error when the flush fails and changes nothing", async () => {
        const { h, fs } = await open({ "docs/a.md": "base" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        h.notesActions.updateText(wsPath("docs/a.md"), "typed");
        fs.failNextWrite();
        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.setName("Papers");

        await h.treeActions.submitDialog();

        expect(await paths(fs)).toContain("docs/a.md");
        expect(state(h).dialog?.error).not.toBeNull();
    });

    it("closes the dialog without a change when the name is unchanged", async () => {
        const { h, fs } = await open({ "docs/a.md": "" });
        h.treeActions.startRename(wsPath("docs"));

        await h.treeActions.submitDialog();

        expect(state(h).dialog).toBeNull();
        expect(await paths(fs)).toContain("docs/a.md");
    });

    it("rejects a sibling collision and keeps the folder", async () => {
        const { h, fs } = await open({ "docs/a.md": "", "Other/b.md": "" });
        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.setName("other");

        await h.treeActions.submitDialog();

        expect(await paths(fs)).toContain("docs/a.md");
        expect(await paths(fs)).toContain("Other/b.md");
    });

    it("allows a case-only change of the folder's own name", async () => {
        const { h, fs } = await open({ "docs/a.md": "" });
        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.setName("Docs");

        await h.treeActions.submitDialog();

        expect(await paths(fs)).toContain("Docs/a.md");
    });

    it("refuses the reserved root name attachments without any change", async () => {
        const { h, fs } = await open({ "docs/a.md": "" });
        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.setName("attachments");

        await h.treeActions.submitDialog();

        expect(await paths(fs)).toContain("docs/a.md");
        expect(state(h).dialog?.pending).toBe(false);
    });

    it("shows the read-only error and changes nothing", async () => {
        const { h, fs } = await open({ "docs/a.md": "" }, { readOnly: true });
        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.setName("Papers");

        await h.treeActions.submitDialog();

        expect(await paths(fs)).toContain("docs/a.md");
        expect(state(h).dialog?.error ?? "permission-denied").toBe(
            "permission-denied",
        );
    });
});

describe("deleting a folder", () => {
    it("moves the folder to the trash, closes the tabs inside and prunes the tree state", async () => {
        const { h, fs } = await open({ "docs/a.md": "A", "keep.md": "K" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        await h.notesActions.openNote(wsPath("keep.md"));
        expandFolders(h.treeStore, ["docs"]);
        setSelection(h.treeStore, new Set(["docs/a.md"]), "docs/a.md");
        h.treeActions.requestDelete([wsPath("docs")]);

        await h.treeActions.confirmDelete();

        expect(await paths(fs)).toEqual(["keep.md"]);
        expect(h.notesStore.getState().openNotes.map((n) => n.path)).toEqual([
            "keep.md",
        ]);
        expect(state(h).expanded.has("docs")).toBe(false);
        expect(state(h).selected.size).toBe(0);
    });

    it("flushes unsaved notes first and saves them before they are trashed", async () => {
        const { h } = await open({ "docs/a.md": "base" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        h.notesActions.updateText(wsPath("docs/a.md"), "typed");

        const result = await h.notesActions.deleteFolder(wsPath("docs"));

        expect(result.ok).toBe(true);
        expect(h.notesStore.getState().openNotes).toEqual([]);
    });

    it("opens the Save-failed dialog when the flush fails and keeps the folder", async () => {
        const { h, fs } = await open({ "docs/a.md": "base" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        h.notesActions.updateText(wsPath("docs/a.md"), "typed");
        fs.failNextWrite();
        h.treeActions.requestDelete([wsPath("docs")]);

        await h.treeActions.confirmDelete();

        expect(await paths(fs)).toContain("docs/a.md");
        expect(h.leaveStore.getState().pending).toEqual({
            kind: "delete-folder",
            path: "docs",
        });
        expect(h.feedbackStore.getState().messages).toEqual([]);
    });

    it("cancelling the Save-failed dialog cancels the delete", async () => {
        const { h, fs } = await open({ "docs/a.md": "base" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        h.notesActions.updateText(wsPath("docs/a.md"), "typed");
        fs.failNextWrite();
        h.treeActions.requestDelete([wsPath("docs")]);
        await h.treeActions.confirmDelete();

        h.leaveActions.cancel();

        expect(h.leaveStore.getState().pending).toBeNull();
        expect(await paths(fs)).toContain("docs/a.md");
    });

    it("retrying the Save-failed dialog saves and then deletes", async () => {
        const { h, fs } = await open({ "docs/a.md": "base", "k.md": "" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        h.notesActions.updateText(wsPath("docs/a.md"), "typed");
        fs.failNextWrite();
        h.treeActions.requestDelete([wsPath("docs")]);
        await h.treeActions.confirmDelete();

        await h.leaveActions.retry();

        expect(h.leaveStore.getState().pending).toBeNull();
        expect(await paths(fs)).toEqual(["k.md"]);
    });

    it("retries only the notes in the folder when an unrelated note has a write conflict", async () => {
        const { h, fs } = await open({ "docs/a.md": "base", "k.md": "base" });
        const outside = wsPath("k.md");
        const inside = wsPath("docs/a.md");
        await h.notesActions.openNote(outside);
        h.notesActions.updateText(outside, "unsaved");
        fs.externalWrite(outside, new TextEncoder().encode("external"));
        await h.notesActions.openNote(inside);
        h.notesActions.updateText(inside, "typed");
        fs.failNextWrite();
        h.treeActions.requestDelete([wsPath("docs")]);
        await h.treeActions.confirmDelete();
        expect(h.leaveStore.getState().pending?.kind).toBe("delete-folder");

        await h.leaveActions.retry();

        expect(h.leaveStore.getState().pending).toBeNull();
        expect(await paths(fs)).toEqual(["k.md"]);
        expect(await savedText(fs, outside)).toBe("external");
        expect(h.notesStore.getState().openNotes).toEqual([
            expect.objectContaining({ path: outside, text: "unsaved" }),
        ]);
    });

    it("discarding the Save-failed dialog deletes without saving", async () => {
        const { h, fs } = await open({ "docs/a.md": "base", "k.md": "" });
        await h.notesActions.openNote(wsPath("docs/a.md"));
        h.notesActions.updateText(wsPath("docs/a.md"), "typed");
        fs.failNextWrite();
        h.treeActions.requestDelete([wsPath("docs")]);
        await h.treeActions.confirmDelete();

        await h.leaveActions.discard();

        expect(await paths(fs)).toEqual(["k.md"]);
        expect(h.notesStore.getState().openNotes).toEqual([]);
    });

    it("reports a read-only workspace and keeps the folder", async () => {
        const { h, fs } = await open({ "docs/a.md": "" });
        h.setTrashReadOnly(true);
        h.treeActions.requestDelete([wsPath("docs")]);

        await h.treeActions.confirmDelete();

        expect(await paths(fs)).toContain("docs/a.md");
        expect(h.notesStore.getState().createError?.code).toBe(
            "permission-denied",
        );
    });
});

describe("moving a folder", () => {
    it("drops a folder on another folder, rewrites links, follows tabs and focuses it", async () => {
        const { h, fs } = await open({
            "a/f/one.md": "[x](../side.md)",
            "a/side.md": "s",
            "b/keep.md": "",
        });
        await h.notesActions.openNote(wsPath("a/f/one.md"));
        h.treeActions.dragStart("a/f");

        await h.treeActions.drop({ type: "folder", id: "b" });

        expect(await paths(fs)).toContain("b/f/one.md");
        expect(await savedText(fs, "b/f/one.md")).toBe("[x](../../a/side.md)");
        expect(h.notesStore.getState().activeNote).toBe("b/f/one.md");
        expect(state(h).focusedId).toBe("b/f");
        expect(state(h).expanded.has("b")).toBe(true);
        expect(state(h).dragging.size).toBe(0);
    });

    it("moves to the workspace root", async () => {
        const { h, fs } = await open({ "a/f/n.md": "n" });
        h.treeActions.dragStart("a/f");

        await h.treeActions.drop({ type: "root" });

        expect(await paths(fs)).toContain("f/n.md");
    });

    it("refuses the folder itself and its descendants as drop targets", async () => {
        const { h } = await open({ "a/f/g/n.md": "n", "b/x.md": "" });
        h.treeActions.dragStart("a/f");

        h.treeActions.dropTargetChange({ type: "folder", id: "a/f" });
        expect(state(h).dropTarget).toBeNull();

        h.treeActions.dropTargetChange({ type: "folder", id: "a/f/g" });
        expect(state(h).dropTarget).toBeNull();

        h.treeActions.dropTargetChange({ type: "folder", id: "b" });
        expect(state(h).dropTarget).toEqual({ type: "folder", id: "b" });
    });

    it("does not treat the current parent as a drop target", async () => {
        const { h } = await open({ "a/f/n.md": "n" });
        h.treeActions.dragStart("a/f");

        h.treeActions.dropTargetChange({ type: "folder", id: "a" });

        expect(state(h).dropTarget).toBeNull();
    });

    it("ignores a drop into itself and changes nothing", async () => {
        const { h, fs } = await open({ "a/f/g/n.md": "n" });
        h.treeActions.dragStart("a/f");

        await h.treeActions.drop({ type: "folder", id: "a/f/g" });

        expect(await paths(fs)).toContain("a/f/g/n.md");
    });

    it("reports a collision as a toast and keeps the folder where it was", async () => {
        const { h, fs } = await open({ "a/x/n.md": "n", "b/x/m.md": "m" });
        h.treeActions.dragStart("a/x");

        await h.treeActions.drop({ type: "folder", id: "b" });

        expect(await paths(fs)).toContain("a/x/n.md");
        expect(
            h.feedbackStore.getState().messages.map((m) => m.error.detail),
        ).toEqual([{ kind: "move-collision", name: "x" }]);
        expect(state(h).focusedId).not.toBe("b/x");
    });

    it("remaps expansion and selection of paths inside the moved folder", async () => {
        const { h } = await open({ "a/f/n.md": "n", "b/k.md": "" });
        expandFolders(h.treeStore, ["a", "a/f"]);
        h.treeActions.dragStart("a/f");

        await h.treeActions.drop({ type: "folder", id: "b" });

        expect(state(h).expanded.has("b/f")).toBe(true);
        expect(state(h).expanded.has("a/f")).toBe(false);
    });

    it("shows the read-only error and changes nothing", async () => {
        const { h, fs } = await open(
            { "a/f/n.md": "n", "b/k.md": "" },
            { readOnly: true },
        );
        h.treeActions.dragStart("a/f");

        await h.treeActions.drop({ type: "folder", id: "b" });

        expect(await paths(fs)).toContain("a/f/n.md");
        expect(h.notesStore.getState().createError?.code).toBe(
            "permission-denied",
        );
    });
});
