import { describe, expect, it, vi } from "vitest";
import { createHarness, root, seedFs, wsPath } from "../test-harness";

const A = root("/a");
const B = root("/b");
const n = wsPath("n.md");
const m = wsPath("m.md");

async function setup() {
    const fsA = seedFs({ "n.md": "base", "m.md": "other" });
    const h = createHarness({
        workspaces: { [A]: fsA, [B]: seedFs({ "b.md": "bee" }) },
        picked: A,
    });
    await h.workspaceActions.openWorkspace();
    await h.notesActions.openNote(n);
    await h.notesActions.openNote(m);
    return { h, fsA };
}

async function savedText(fs: ReturnType<typeof seedFs>, path = n) {
    const read = await fs.readText(path);
    return read.ok ? read.value : null;
}

function leave(h: Awaited<ReturnType<typeof setup>>["h"]) {
    return h.leaveStore.getState();
}

describe("committing titles before leaving", () => {
    it("renames a note whose heading changed before closing its tab", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "# Renamed\nbody");

        await h.leaveActions.closeTab(n);

        const listing = await fsA.list();
        expect(
            listing.ok && listing.value.map((entry) => entry.path).sort(),
        ).toEqual(["Renamed.md", "m.md"]);
        expect(await savedText(fsA, wsPath("Renamed.md"))).toBe(
            "# Renamed\nbody",
        );
        expect(h.notesStore.getState().openNotes.map((s) => s.path)).toEqual([
            "m.md",
        ]);
    });

    it("closes the renamed tab when editor blur already started the title commit", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "# Renamed\nbody");

        const committing = h.notesActions.commitTitle(n);
        await Promise.all([committing, h.leaveActions.closeTab(n)]);

        expect(await savedText(fsA, wsPath("Renamed.md"))).toBe(
            "# Renamed\nbody",
        );
        expect(h.notesStore.getState().openNotes.map((s) => s.path)).toEqual([
            "m.md",
        ]);
    });

    it("renames pending notes before the window closes", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(m, "# Other name");

        const closed = await h.leaveActions.handleCloseRequest();

        expect(closed).toBe(true);
        const listing = await fsA.list();
        expect(
            listing.ok && listing.value.map((entry) => entry.path).sort(),
        ).toEqual(["Other name.md", "n.md"]);
    });
});

describe("closing a tab", () => {
    it("closes a dirty tab after flushing and never opens the dialog", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");

        await h.leaveActions.closeTab(n);

        expect(leave(h).pending).toBeNull();
        expect(h.notesStore.getState().openNotes.map((s) => s.path)).toEqual([
            "m.md",
        ]);
        expect(await savedText(fsA)).toBe("typed");
    });

    it("keeps tab and text and asks what to do when the flush fails", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();

        await h.leaveActions.closeTab(n);

        expect(leave(h).pending).toEqual({ kind: "close-tab", path: "n.md" });
        expect(leave(h).error?.code).toBe("unknown");
        const open = h.notesStore.getState().openNotes;
        expect(open.map((s) => s.path)).toEqual(["n.md", "m.md"]);
        expect(open[0]?.text).toBe("typed");
    });

    it("retry closes the tab once the cause is fixed and saves the text", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        await h.leaveActions.closeTab(n);

        await h.leaveActions.retry();

        expect(leave(h).pending).toBeNull();
        expect(await savedText(fsA)).toBe("typed");
        expect(h.notesStore.getState().openNotes.map((s) => s.path)).toEqual([
            "m.md",
        ]);
    });

    it("retry keeps the dialog and the text when saving fails again", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        await h.leaveActions.closeTab(n);

        fsA.failNextWrite();
        await h.leaveActions.retry();

        expect(leave(h).pending).toEqual({ kind: "close-tab", path: "n.md" });
        expect(h.notesStore.getState().openNotes[0]?.text).toBe("typed");
    });

    it("retry re-blocks with the error when closing the tab fails after the save", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        await h.leaveActions.closeTab(n);
        vi.spyOn(h.notesActions, "closeTab").mockResolvedValueOnce({
            ok: false,
            error: { code: "permission-denied", message: "read-only" },
        });

        await h.leaveActions.retry();

        expect(leave(h).pending).toEqual({ kind: "close-tab", path: "n.md" });
        expect(leave(h).error?.code).toBe("permission-denied");
    });

    it("discard closes the tab, drops the text and writes nothing", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        await h.leaveActions.closeTab(n);

        await h.leaveActions.discard();

        expect(leave(h).pending).toBeNull();
        expect(h.notesStore.getState().openNotes.map((s) => s.path)).toEqual([
            "m.md",
        ]);
        expect(await savedText(fsA)).toBe("base");
    });

    it("cancel stays with tab and text and never discards", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        await h.leaveActions.closeTab(n);

        h.leaveActions.cancel();

        expect(leave(h).pending).toBeNull();
        expect(h.notesStore.getState().openNotes[0]?.text).toBe("typed");
        expect(h.notesStore.getState().openNotes).toHaveLength(2);
    });
});

describe("changing workspace", () => {
    it("blocks the switch and keeps the old workspace when the flush fails", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        h.pick(B);

        await h.workspaceActions.openWorkspace();

        expect(leave(h).pending).toEqual({ kind: "change-workspace" });
        expect(h.workspaceStore.getState()).toMatchObject({
            root: A,
            status: "open",
        });
        expect(h.notesStore.getState().openNotes[0]?.text).toBe("typed");
    });

    it("retry continues with the already picked workspace", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        h.pick(B);
        await h.workspaceActions.openWorkspace();
        h.pick(null);

        await h.leaveActions.retry();

        expect(leave(h).pending).toBeNull();
        expect(await savedText(fsA)).toBe("typed");
        expect(h.workspaceStore.getState().root).toBe(B);
        expect(h.notesStore.getState().notes.map((x) => x.name)).toEqual(["b"]);
    });

    it("discard switches anyway, drops the text and writes nothing", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        h.pick(B);
        await h.workspaceActions.openWorkspace();

        await h.leaveActions.discard();

        expect(leave(h).pending).toBeNull();
        expect(h.workspaceStore.getState().root).toBe(B);
        expect(h.notesStore.getState().openNotes).toEqual([]);
        expect(await savedText(fsA)).toBe("base");
    });

    it("cancel stays in the current workspace and forgets the picked one", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        h.pick(B);
        await h.workspaceActions.openWorkspace();

        h.leaveActions.cancel();
        const resumed = await h.workspaceActions.continueOpen({
            discard: true,
        });

        expect(resumed.ok).toBe(true);
        expect(leave(h).pending).toBeNull();
        expect(h.workspaceStore.getState().root).toBe(A);
        expect(h.notesStore.getState().openNotes[0]?.text).toBe("typed");
    });

    it("switches without any dialog when the flush succeeds", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        h.pick(B);

        await h.workspaceActions.openWorkspace();

        expect(leave(h).pending).toBeNull();
        expect(await savedText(fsA)).toBe("typed");
        expect(h.workspaceStore.getState().root).toBe(B);
    });
});

describe("closing the window", () => {
    it("allows the close after flushing every dirty note", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        h.notesActions.updateText(m, "typed too");

        const allowed = await h.leaveActions.handleCloseRequest();

        expect(allowed).toBe(true);
        expect(leave(h).pending).toBeNull();
        expect(await savedText(fsA)).toBe("typed");
        expect(await savedText(fsA, m)).toBe("typed too");
    });

    it("allows the close with nothing open", async () => {
        const h = createHarness();

        expect(await h.leaveActions.handleCloseRequest()).toBe(true);
    });

    it("prevents the close and asks when a flush fails", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();

        const allowed = await h.leaveActions.handleCloseRequest();

        expect(allowed).toBe(false);
        expect(leave(h).pending).toEqual({ kind: "close-window" });
        expect(h.windowState.destroyed).toBe(0);
        expect(h.notesStore.getState().openNotes[0]?.text).toBe("typed");
    });

    it("discard destroys the window and cancel does not", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        await h.leaveActions.handleCloseRequest();

        h.leaveActions.cancel();
        expect(h.windowState.destroyed).toBe(0);
        fsA.failNextWrite();
        await h.leaveActions.handleCloseRequest();
        await h.leaveActions.discard();

        expect(h.windowState.destroyed).toBe(1);
        expect(await savedText(fsA)).toBe("base");
    });

    it("retry destroys the window only after the save succeeds", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(n, "typed");
        fsA.failNextWrite();
        await h.leaveActions.handleCloseRequest();

        fsA.failNextWrite();
        await h.leaveActions.retry();
        expect(h.windowState.destroyed).toBe(0);
        expect(leave(h).pending).toEqual({ kind: "close-window" });

        await h.leaveActions.retry();
        expect(h.windowState.destroyed).toBe(1);
        expect(await savedText(fsA)).toBe("typed");
    });
});

describe("switching notes", () => {
    it("flushes the note being left without opening a dialog", async () => {
        const { h, fsA } = await setup();
        h.notesActions.updateText(m, "edited");
        await h.notesActions.openNote(n);
        await Promise.resolve();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(await savedText(fsA, m)).toBe("edited");
        expect(leave(h).pending).toBeNull();
    });
});
