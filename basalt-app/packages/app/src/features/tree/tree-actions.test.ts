import { describe, expect, it } from "vitest";
import { createHarness, root, seedFs, wsPath } from "../test-harness";

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

describe("requestMenu", () => {
    it("targets the workspace root without a row id", async () => {
        const { h } = await open({ "a.md": "" });

        h.treeActions.requestMenu(null, { x: 3, y: 4 });

        expect(h.treeStore.getState().menu).toEqual({
            target: { kind: "root" },
            point: { x: 3, y: 4 },
        });
    });

    it("targets a note or a folder by its row id and focuses that row", async () => {
        const { h } = await open({ "a.md": "", "docs/b.md": "" });

        h.treeActions.requestMenu("docs", { x: 1, y: 2 });
        expect(h.treeStore.getState().menu?.target).toEqual({
            kind: "folder",
            path: "docs",
        });

        h.treeActions.requestMenu("a.md", { x: 1, y: 2 });
        expect(h.treeStore.getState().menu?.target).toEqual({
            kind: "note",
            path: "a.md",
        });
        expect(h.treeStore.getState().focusedId).toBe("a.md");
    });

    it("opens no menu for a row that is not in the tree", async () => {
        const { h } = await open({ "a.md": "" });

        h.treeActions.requestMenu("gone.md", { x: 1, y: 2 });

        expect(h.treeStore.getState().menu).toBeNull();
    });
});

describe("newNote", () => {
    it("creates and opens Untitled in the folder and closes the menu", async () => {
        const { h, fs } = await open({ "docs/a.md": "" });
        h.treeActions.requestMenu("docs", { x: 0, y: 0 });

        await h.treeActions.newNote(wsPath("docs"));

        expect(h.treeStore.getState().menu).toBeNull();
        expect(h.notesStore.getState().activeNote).toBe("docs/Untitled.md");
        expect(await paths(fs)).toContain("docs/Untitled.md");
    });

    it("creates in the root for a null parent", async () => {
        const { h } = await open({ "docs/a.md": "" });

        await h.treeActions.newNote(null);

        expect(h.notesStore.getState().activeNote).toBe("Untitled.md");
    });
});

describe("rename", () => {
    it("opens with the note name and renames the file, keeping the note open", async () => {
        const { h, fs } = await open({ "docs/old.md": "# Keep" });
        await h.notesActions.openNote(wsPath("docs/old.md"));

        h.treeActions.startRename(wsPath("docs/old.md"));
        expect(h.treeStore.getState().dialog).toMatchObject({
            kind: "rename",
            name: "old",
        });
        h.treeActions.setName("fresh");
        await h.treeActions.submitDialog();

        expect(h.treeStore.getState().dialog).toBeNull();
        expect(await paths(fs)).toEqual(["docs", "docs/fresh.md"]);
        expect(h.notesStore.getState().activeNote).toBe("docs/fresh.md");
        expect(h.notesStore.getState().openNotes.map((s) => s.path)).toEqual([
            "docs/fresh.md",
        ]);
        expect(h.treeStore.getState().focusedId).toBe("docs/fresh.md");
    });

    it("allows a case-only change of the note's own name", async () => {
        const { h, fs } = await open({ "ideas.md": "x" });

        h.treeActions.startRename(wsPath("ideas.md"));
        h.treeActions.setName("Ideas");
        await h.treeActions.submitDialog();

        expect(h.treeStore.getState().dialog).toBeNull();
        expect(await paths(fs)).toEqual(["Ideas.md"]);
    });

    it.each([
        ["a case-only collision", "BETA"],
        ["a Unicode-form-only collision", "Café"],
    ])("does not rename onto %s and changes nothing", async (_label, name) => {
        const { h, fs } = await open({
            "alpha.md": "1",
            "beta.md": "2",
            "Café.md": "3",
        });
        const before = await paths(fs);

        h.treeActions.startRename(wsPath("alpha.md"));
        h.treeActions.setName(name);
        await h.treeActions.submitDialog();

        expect(await paths(fs)).toEqual(before);
        expect(h.treeStore.getState().dialog).toMatchObject({
            kind: "rename",
            pending: false,
        });
    });

    it("keeps the dialog open with the error code when the rename fails", async () => {
        const { h, fs } = await open({ "alpha.md": "1" });
        h.treeActions.startRename(wsPath("alpha.md"));
        h.treeActions.setName("beta");
        fs.externalDelete(wsPath("alpha.md"));

        await h.treeActions.submitDialog();

        expect(h.treeStore.getState().dialog).toMatchObject({
            error: "not-found",
            pending: false,
        });
    });

    it("closes without touching the disk when the name is unchanged", async () => {
        const { h, fs } = await open({ "alpha.md": "1" });
        const before = await paths(fs);

        h.treeActions.startRename(wsPath("alpha.md"));
        await h.treeActions.submitDialog();

        expect(h.treeStore.getState().dialog).toBeNull();
        expect(await paths(fs)).toEqual(before);
    });

    it("reports permission-denied in a read-only workspace and changes nothing", async () => {
        const { h, fs } = await open({ "alpha.md": "1" }, { readOnly: true });

        h.treeActions.startRename(wsPath("alpha.md"));
        h.treeActions.setName("beta");
        await h.treeActions.submitDialog();

        expect(h.treeStore.getState().dialog).toMatchObject({
            error: "permission-denied",
        });
        expect(await paths(fs)).toEqual(["alpha.md"]);
    });

    it("does not open for a folder or a missing note", async () => {
        const { h } = await open({ "docs/a.md": "" });

        h.treeActions.startRename(wsPath("docs"));
        h.treeActions.startRename(wsPath("gone.md"));

        expect(h.treeStore.getState().dialog).toBeNull();
    });
});

describe("new folder", () => {
    it("creates the folder in the root, shows it and focuses it", async () => {
        const { h, fs } = await open({ "a.md": "" });

        h.treeActions.startNewFolder(null);
        h.treeActions.setName("Ideas");
        await h.treeActions.submitDialog();

        expect(h.treeStore.getState().dialog).toBeNull();
        expect(await paths(fs)).toEqual(["Ideas", "a.md"]);
        expect(h.treeStore.getState().focusedId).toBe("Ideas");
        expect(h.notesStore.getState().tree.map((node) => node.name)).toContain(
            "Ideas",
        );
    });

    it("creates inside a folder and expands the folder and the new one", async () => {
        const { h, fs } = await open({ "docs/a.md": "" });

        h.treeActions.startNewFolder(wsPath("docs"));
        h.treeActions.setName("2026");
        await h.treeActions.submitDialog();

        expect(await paths(fs)).toContain("docs/2026");
        const { expanded } = h.treeStore.getState();
        expect(expanded.has("docs")).toBe(true);
        expect(expanded.has("docs/2026")).toBe(true);
    });

    it.each(["docs", "DOCS"])(
        "does not create a folder named %j that collides with a sibling",
        async (name) => {
            const { h, fs } = await open({ "docs/x.md": "" });
            const before = await paths(fs);

            h.treeActions.startNewFolder(null);
            h.treeActions.setName(name);
            await h.treeActions.submitDialog();

            expect(await paths(fs)).toEqual(before);
            expect(h.treeStore.getState().dialog).not.toBeNull();
        },
    );

    it("allows a folder with the same stem as a note", async () => {
        const { h, fs } = await open({ "a.md": "" });

        h.treeActions.startNewFolder(null);
        h.treeActions.setName("a");
        await h.treeActions.submitDialog();

        expect(await paths(fs)).toEqual(["a", "a.md"]);
    });

    it("keeps the dialog open with permission-denied in a read-only workspace", async () => {
        const { h, fs } = await open({ "a.md": "" }, { readOnly: true });

        h.treeActions.startNewFolder(null);
        h.treeActions.setName("Ideas");
        await h.treeActions.submitDialog();

        expect(h.treeStore.getState().dialog).toMatchObject({
            kind: "new-folder",
            error: "permission-denied",
        });
        expect(await paths(fs)).toEqual(["a.md"]);
    });

    it("does nothing for an empty or invalid name", async () => {
        const { h, fs } = await open({});

        h.treeActions.startNewFolder(null);
        await h.treeActions.submitDialog();
        h.treeActions.setName("a/b");
        await h.treeActions.submitDialog();

        expect(await paths(fs)).toEqual([]);
        expect(h.treeStore.getState().dialog).toMatchObject({ pending: false });
    });

    it("cancel closes the dialog", async () => {
        const { h } = await open({});
        h.treeActions.startNewFolder(null);

        h.treeActions.cancelDialog();

        expect(h.treeStore.getState().dialog).toBeNull();
    });
});

describe("toggleFolder and focusRow", () => {
    it("toggles expansion and records focus", async () => {
        const { h } = await open({ "docs/a.md": "" });
        h.treeActions.toggleFolder("docs");
        h.treeActions.focusRow("docs");

        expect(h.treeStore.getState().expanded.has("docs")).toBe(true);
        expect(h.treeStore.getState().focusedId).toBe("docs");
    });
});

describe("dragging a note onto a folder", () => {
    it("moves the file, the open tab follows and the destination expands", async () => {
        const { h, fs } = await open({ "a.md": "text", "docs/b.md": "" });
        await h.notesActions.openNote(wsPath("a.md"));

        h.treeActions.dragStart("a.md");
        await h.treeActions.drop({ type: "folder", id: "docs" });

        expect(await paths(fs)).toEqual(["docs", "docs/a.md", "docs/b.md"]);
        expect(h.notesStore.getState().activeNote).toBe("docs/a.md");
        expect(h.notesStore.getState().openNotes.map((s) => s.path)).toEqual([
            "docs/a.md",
        ]);
        expect(h.treeStore.getState().expanded.has("docs")).toBe(true);
        expect(h.treeStore.getState().focusedId).toBe("docs/a.md");
        expect(h.treeStore.getState().dragging.size).toBe(0);
        expect(h.notesStore.getState().createError).toBeNull();
    });

    it("moves a note to the workspace root", async () => {
        const { h, fs } = await open({ "docs/a.md": "" });
        await h.notesActions.openNote(wsPath("docs/a.md"));

        h.treeActions.dragStart("docs/a.md");
        await h.treeActions.drop({ type: "root" });

        expect(await paths(fs)).toEqual(["a.md", "docs"]);
        expect(h.notesStore.getState().activeNote).toBe("a.md");
    });

    it("flushes unsaved text before moving and keeps it", async () => {
        const { h, fs } = await open({ "a.md": "old", "docs/b.md": "" });
        await h.notesActions.openNote(wsPath("a.md"));
        h.notesActions.updateText(wsPath("a.md"), "typed");

        h.treeActions.dragStart("a.md");
        await h.treeActions.drop({ type: "folder", id: "docs" });

        const text = await fs.readText(wsPath("docs/a.md"));
        expect(text).toEqual({ ok: true, value: "typed" });
    });

    it("rewrites a relative image link in the moved note", async () => {
        const { h, fs } = await open({
            "a.md": "![pic](attachments/p.png)",
            "attachments/p.png": "x",
            "docs/b.md": "",
        });

        h.treeActions.dragStart("a.md");
        await h.treeActions.drop({ type: "folder", id: "docs" });

        const text = await fs.readText(wsPath("docs/a.md"));
        expect(text).toEqual({
            ok: true,
            value: "![pic](../attachments/p.png)",
        });
    });

    it("ignores a drop on the note's own folder and the root for a root note without touching the disk", async () => {
        const { h, fs } = await open({ "a.md": "", "docs/b.md": "" });
        const before = await paths(fs);
        h.treeActions.dragStart("docs/b.md");
        await h.treeActions.drop({ type: "folder", id: "docs" });
        h.treeActions.dragStart("a.md");
        await h.treeActions.drop({ type: "root" });

        expect(await paths(fs)).toEqual(before);
        expect(h.notesStore.getState().createError).toBeNull();
        expect(h.treeStore.getState().expanded.has("docs")).toBe(false);
        expect(h.treeStore.getState().focusedId).toBeNull();
    });

    it("ignores a drop when nothing is being dragged", async () => {
        const { h, fs } = await open({ "a.md": "", "docs/b.md": "" });
        const before = await paths(fs);

        await h.treeActions.drop({ type: "folder", id: "docs" });

        expect(await paths(fs)).toEqual(before);
    });

    it("ignores a drop on a folder that is not in the tree", async () => {
        const { h, fs } = await open({ "a.md": "" });

        h.treeActions.dragStart("a.md");
        await h.treeActions.drop({ type: "folder", id: "gone" });

        expect(await paths(fs)).toEqual(["a.md"]);
    });

    it("shows a collision as the sidebar error and moves nothing", async () => {
        const { h, fs } = await open({ "a.md": "1", "docs/A.md": "2" });

        h.treeActions.dragStart("a.md");
        await h.treeActions.drop({ type: "folder", id: "docs" });

        expect(await paths(fs)).toEqual(["a.md", "docs", "docs/A.md"]);
        expect(h.notesStore.getState().createError?.detail).toEqual({
            kind: "move-collision",
            name: "a.md",
        });
        expect(h.treeStore.getState().expanded.has("docs")).toBe(false);
    });

    it("shows the read-only error and changes nothing", async () => {
        const { h, fs } = await open(
            { "a.md": "", "docs/b.md": "" },
            { readOnly: true },
        );

        h.treeActions.dragStart("a.md");
        await h.treeActions.drop({ type: "folder", id: "docs" });

        expect(await paths(fs)).toEqual(["a.md", "docs", "docs/b.md"]);
        expect(h.notesStore.getState().createError?.code).toBe(
            "permission-denied",
        );
    });

    it("ending a drag elsewhere does nothing to the disk", async () => {
        const { h, fs } = await open({ "a.md": "", "docs/b.md": "" });
        const before = await paths(fs);
        h.treeActions.dragStart("a.md");
        h.treeActions.dropTargetChange({ type: "folder", id: "docs" });

        h.treeActions.dragEnd();

        expect(await paths(fs)).toEqual(before);
        expect(h.treeStore.getState().dragging.size).toBe(0);
        expect(h.treeStore.getState().dropTarget).toBeNull();
    });
});

describe("drop target highlight", () => {
    it("is set for a folder that would receive the note and for the root", async () => {
        const { h } = await open({ "a.md": "", "docs/b.md": "" });
        h.treeActions.dragStart("a.md");

        h.treeActions.dropTargetChange({ type: "folder", id: "docs" });
        expect(h.treeStore.getState().dropTarget).toEqual({
            type: "folder",
            id: "docs",
        });

        h.treeActions.dragStart("docs/b.md");
        h.treeActions.dropTargetChange({ type: "root" });
        expect(h.treeStore.getState().dropTarget).toEqual({ type: "root" });
    });

    it("is not set for the note's own folder, the root of a root note, an unknown folder, or no target", async () => {
        const { h } = await open({ "a.md": "", "docs/b.md": "" });

        h.treeActions.dragStart("docs/b.md");
        h.treeActions.dropTargetChange({ type: "folder", id: "docs" });
        expect(h.treeStore.getState().dropTarget).toBeNull();

        h.treeActions.dragStart("a.md");
        h.treeActions.dropTargetChange({ type: "root" });
        expect(h.treeStore.getState().dropTarget).toBeNull();
        h.treeActions.dropTargetChange({ type: "folder", id: "nope" });
        expect(h.treeStore.getState().dropTarget).toBeNull();

        h.treeActions.dropTargetChange({ type: "folder", id: "docs" });
        h.treeActions.dropTargetChange(null);
        expect(h.treeStore.getState().dropTarget).toBeNull();
    });

    it("is not set when nothing is being dragged", async () => {
        const { h } = await open({ "docs/b.md": "" });

        h.treeActions.dropTargetChange({ type: "folder", id: "docs" });

        expect(h.treeStore.getState().dropTarget).toBeNull();
    });
});

describe("hoverOpen", () => {
    it("expands the folder while dragging only", async () => {
        const { h } = await open({ "a.md": "", "docs/b.md": "" });

        h.treeActions.hoverOpen("docs");
        expect(h.treeStore.getState().expanded.has("docs")).toBe(false);

        h.treeActions.dragStart("a.md");
        h.treeActions.hoverOpen("docs");
        expect(h.treeStore.getState().expanded.has("docs")).toBe(true);
    });
});
