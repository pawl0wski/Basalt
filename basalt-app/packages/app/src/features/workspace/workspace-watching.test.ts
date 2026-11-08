import { describe, expect, it } from "vitest";
import { createHarness, root, seedFs, settle, wsPath } from "../test-harness";
import { WATCH_DEBOUNCE_MS } from "../../services";

const A = root("/a");
const B = root("/b");

const bytes = (text: string) => new TextEncoder().encode(text);

async function openWorkspace(
    files: Record<string, string>,
    options: Parameters<typeof seedFs>[1] = {},
) {
    const fs = seedFs(files, options);
    const h = createHarness({ workspaces: { [A]: fs }, picked: A });
    await h.workspaceActions.openWorkspace();
    return { h, fs };
}

function names(h: Awaited<ReturnType<typeof openWorkspace>>["h"]) {
    return h.notesStore.getState().notes.map((note) => note.path);
}

describe("workspace watching", () => {
    it("debounces for 300 ms and re-lists when a Markdown file appears", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "" });

        fs.externalWrite(wsPath("b.md"), bytes("hi"));
        await settle();
        expect(names(h)).toEqual(["a.md"]);
        expect(h.watchScheduler.delays).toEqual([WATCH_DEBOUNCE_MS]);
        expect(WATCH_DEBOUNCE_MS).toBe(300);

        h.watchScheduler.fire();
        await settle();
        expect(names(h)).toEqual(["a.md", "b.md"]);
    });

    it("removes a note that was deleted outside the app", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "", "b.md": "" });

        fs.externalDelete(wsPath("a.md"));
        h.watchScheduler.fire();
        await settle();

        expect(names(h)).toEqual(["b.md"]);
    });

    it("does not re-list for a batch with only non-Markdown files", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "" });
        fs.externalWrite(wsPath("c.md"), bytes(""));
        await settle();
        h.watchScheduler.fire();
        await settle();
        expect(names(h)).toEqual(["a.md", "c.md"]);
        h.notesStore.setState({ notes: [] });

        fs.externalWrite(wsPath("image.png"), bytes("x"));
        h.watchScheduler.fire();
        await settle();

        expect(names(h)).toEqual([]);
    });

    it("stays in live mode when the watcher starts", async () => {
        const { h } = await openWorkspace({});
        expect(h.workspaceStore.getState().watchMode).toBe("live");
    });

    it("falls back to focus mode when the watcher cannot start", async () => {
        const { h } = await openWorkspace({}, { failWatch: true });
        expect(h.workspaceStore.getState().watchMode).toBe("focus-fallback");
    });

    it("re-lists on window focus only in focus-fallback mode", async () => {
        const live = await openWorkspace({ "a.md": "" });
        live.fs.externalWrite(wsPath("b.md"), bytes(""));
        await live.h.workspaceActions.refreshOnFocus();
        expect(names(live.h)).toEqual(["a.md"]);

        const fallback = await openWorkspace(
            { "a.md": "" },
            { failWatch: true },
        );
        fallback.fs.externalWrite(wsPath("b.md"), bytes(""));
        await fallback.h.workspaceActions.refreshOnFocus();
        expect(names(fallback.h)).toEqual(["a.md", "b.md"]);
    });

    it("stops watching when another workspace is opened", async () => {
        const first = seedFs({ "a.md": "" });
        const h = createHarness({
            workspaces: { [A]: first, [B]: seedFs({ "z.md": "" }) },
            picked: A,
        });
        await h.workspaceActions.openWorkspace();
        h.pick(B);
        await h.workspaceActions.openWorkspace();

        first.externalWrite(wsPath("late.md"), bytes(""));
        expect(h.watchScheduler.pending()).toBe(0);
        h.watchScheduler.fire();
        await settle();

        expect(names(h)).toEqual(["z.md"]);
    });

    it("stops watching and drops pending batches on leaveWorkspace", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "" });
        fs.externalWrite(wsPath("b.md"), bytes(""));
        expect(h.watchScheduler.pending()).toBe(1);

        await h.workspaceActions.leaveWorkspace();

        expect(h.watchScheduler.pending()).toBe(0);
        fs.externalWrite(wsPath("c.md"), bytes(""));
        expect(h.watchScheduler.pending()).toBe(0);
        expect(h.workspaceStore.getState()).toMatchObject({
            status: "welcome",
            root: null,
        });
        expect(h.notesStore.getState().notes).toEqual([]);
    });

    it("returns to welcome with the unavailable notice when the root is lost", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "" });

        fs.removeRoot();
        await settle();

        expect(h.workspaceStore.getState()).toMatchObject({
            status: "welcome",
            root: null,
            notice: "workspace-unavailable",
        });
        expect(h.persisted().lastWorkspace).toBe(A);
    });

    it("keeps the workspace open when the root is lost while text is unsaved", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "x" });
        await h.notesActions.openNote(wsPath("a.md"));
        h.notesActions.updateText(wsPath("a.md"), "x edited");

        fs.removeRoot();
        await settle();

        expect(h.workspaceStore.getState().status).toBe("open");
        expect(h.notesStore.getState().openNotes[0]?.text).toBe("x edited");
    });
});
