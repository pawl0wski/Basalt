import { describe, expect, it } from "vitest";
import { defaultAppSettings, type AppSettings } from "@basalt/core";
import { createHarness, root, seedFs, settle, wsPath } from "../test-harness";
import { isDirty } from "./notes-store";

const A = root("/a");
const n = wsPath("n.md");

async function openWorkspace(
    files: Record<string, string>,
    options: Parameters<typeof seedFs>[1] = {},
    settings?: AppSettings,
) {
    const fs = seedFs(files, options);
    const h = createHarness({ workspaces: { [A]: fs }, picked: A, settings });
    await h.workspaceActions.openWorkspace();
    return { h, fs };
}

function session(h: Awaited<ReturnType<typeof openWorkspace>>["h"]) {
    const found = h.notesStore.getState().openNotes[0];
    if (!found) throw new Error("no session");
    return found;
}

describe("opening notes", () => {
    it("opens a note as the active tab with normalized text, eol and bom", async () => {
        const { h } = await openWorkspace({ "n.md": "﻿a\r\nb\r\n" });
        const result = await h.notesActions.openNote(n);
        expect(result.ok).toBe(true);
        expect(h.notesStore.getState().activeNote).toBe("n.md");
        expect(session(h)).toMatchObject({
            path: "n.md",
            text: "a\nb\n",
            baseText: "a\nb\n",
            eol: "crlf",
            bom: true,
            error: null,
            saveStatus: "saved",
        });
    });

    it("focuses an already open note instead of opening it twice", async () => {
        const { h } = await openWorkspace({ "n.md": "1", "m.md": "2" });
        await h.notesActions.openNote(n);
        await h.notesActions.openNote(wsPath("m.md"));
        await h.notesActions.openNote(n);
        const state = h.notesStore.getState();
        expect(state.openNotes.map((s) => s.path)).toEqual(["n.md", "m.md"]);
        expect(state.activeNote).toBe("n.md");
    });

    it("never writes while a note is only opened or viewed", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "a\r\nb" });
        await h.notesActions.openNote(n);
        h.scheduler.fire();
        await h.notesActions.saveNow(n);
        const raw = await fs.readText(n);
        expect(raw.ok && raw.value).toBe("a\r\nb");
        expect(h.scheduler.pending()).toBe(0);
    });

    it("does not add a tab for a missing note", async () => {
        const { h } = await openWorkspace({});
        const result = await h.notesActions.openNote(n);
        expect(!result.ok && result.error.code).toBe("not-found");
        expect(h.notesStore.getState().openNotes).toEqual([]);
        expect(h.notesStore.getState().activeNote).toBeNull();
    });

    it("keeps a note that fails to open as an error tab with no text", async () => {
        const { h, fs } = await openWorkspace({});
        fs.externalWrite(n, new Uint8Array([0xff, 0xfe, 0x41]));
        const result = await h.notesActions.openNote(n);
        expect(!result.ok && result.error.code).toBe("not-utf8");
        expect(session(h)).toMatchObject({
            error: { code: "not-utf8" },
            text: "",
        });
        h.notesActions.updateText(n, "typed");
        expect(session(h).text).toBe("");
        expect(h.scheduler.pending()).toBe(0);
    });
});

describe("editing and saving", () => {
    it("derives dirty from text and baseText", async () => {
        const { h } = await openWorkspace({ "n.md": "a" });
        await h.notesActions.openNote(n);
        expect(isDirty(session(h))).toBe(false);
        h.notesActions.updateText(n, "ab");
        expect(isDirty(session(h))).toBe(true);
        expect(session(h).saveStatus).toBe("pending");
        h.notesActions.updateText(n, "a");
        expect(isDirty(session(h))).toBe(false);
        expect(h.scheduler.pending()).toBe(0);
    });

    it("autosaves after the debounce and keeps the eol and bom of the file", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "﻿a\r\n" });
        await h.notesActions.openNote(n);
        h.notesActions.updateText(n, "a\nb\n");
        h.scheduler.fire();
        await settle();
        expect(session(h)).toMatchObject({
            baseText: "a\nb\n",
            saveStatus: "saved",
            error: null,
        });
        const raw = await fs.readText(n);
        expect(raw.ok && raw.value).toBe("﻿a\r\nb\r\n");
    });

    it("saveNow writes immediately", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "a" });
        await h.notesActions.openNote(n);
        h.notesActions.updateText(n, "b");
        const result = await h.notesActions.saveNow(n);
        expect(result.ok).toBe(true);
        const raw = await fs.readText(n);
        expect(raw.ok && raw.value).toBe("b");
        expect(isDirty(session(h))).toBe(false);
    });

    it("keeps the text and maps the error when saving fails, then retries", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "a" });
        await h.notesActions.openNote(n);
        h.notesActions.updateText(n, "typed");
        fs.failNextWrite();
        const failed = await h.notesActions.saveNow(n);
        expect(!failed.ok && failed.error.code).toBe("unknown");
        expect(session(h)).toMatchObject({
            text: "typed",
            baseText: "a",
            saveStatus: "paused",
            error: { code: "unknown" },
        });
        expect(isDirty(session(h))).toBe(true);
        const retried = await h.notesActions.saveNow(n);
        expect(retried.ok).toBe(true);
        expect(session(h)).toMatchObject({
            text: "typed",
            baseText: "typed",
            saveStatus: "saved",
            error: null,
        });
    });

    it("maps a read-only workspace save to permission-denied and keeps the text", async () => {
        const { h } = await openWorkspace({ "n.md": "a" }, { readOnly: true });
        await h.notesActions.openNote(n);
        h.notesActions.updateText(n, "typed");
        const result = await h.notesActions.saveNow(n);
        expect(!result.ok && result.error.code).toBe("permission-denied");
        expect(session(h)).toMatchObject({
            text: "typed",
            error: { code: "permission-denied" },
        });
    });

    it("reports a conflict when the file changed on disk and keeps the text", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "a" });
        await h.notesActions.openNote(n);
        fs.externalWrite(n, new TextEncoder().encode("other"));
        h.notesActions.updateText(n, "mine");
        const result = await h.notesActions.saveNow(n);
        expect(!result.ok && result.error.code).toBe("conflict");
        expect(session(h)).toMatchObject({
            text: "mine",
            error: { code: "conflict" },
            saveStatus: "paused",
        });
    });

    it("reloadNote adopts the disk text, clears the error and resumes autosave", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "a" });
        await h.notesActions.openNote(n);
        fs.externalWrite(n, new TextEncoder().encode("x\r\ny"));
        h.notesActions.updateText(n, "mine");
        await h.notesActions.saveNow(n);
        const reloaded = await h.notesActions.reloadNote(n);
        expect(reloaded.ok).toBe(true);
        expect(session(h)).toMatchObject({
            text: "x\ny",
            baseText: "x\ny",
            eol: "crlf",
            error: null,
            saveStatus: "saved",
        });
        h.notesActions.updateText(n, "x\nyz");
        await h.notesActions.saveNow(n);
        const raw = await fs.readText(n);
        expect(raw.ok && raw.value).toBe("x\r\nyz");
    });
});

describe("creating notes", () => {
    it("creates Untitled, Untitled 1, Untitled 2 and opens each", async () => {
        const { h, fs } = await openWorkspace({});
        for (const name of ["Untitled", "Untitled 1", "Untitled 2"]) {
            const created = await h.notesActions.createNote();
            expect(created.ok && created.value.name).toBe(name);
            expect(h.notesStore.getState().activeNote).toBe(`${name}.md`);
        }
        const state = h.notesStore.getState();
        expect(state.notes.map((x) => x.name)).toEqual([
            "Untitled",
            "Untitled 1",
            "Untitled 2",
        ]);
        expect(state.openNotes).toHaveLength(3);
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((e) => e.path).sort()).toEqual([
            "Untitled 1.md",
            "Untitled 2.md",
            "Untitled.md",
        ]);
    });

    it("skips names that already exist", async () => {
        const { h } = await openWorkspace({ "Untitled.md": "" });
        const created = await h.notesActions.createNote();
        expect(created.ok && created.value.name).toBe("Untitled 1");
    });

    it("adds no list entry and no tab in a read-only workspace", async () => {
        const { h } = await openWorkspace({}, { readOnly: true });
        const created = await h.notesActions.createNote();
        expect(!created.ok && created.error.code).toBe("permission-denied");
        expect(h.notesStore.getState().notes).toEqual([]);
        expect(h.notesStore.getState().openNotes).toEqual([]);
    });
});

describe("tabs", () => {
    it("closing a dirty tab flushes first and activates a neighbour", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "1", "m.md": "2" });
        await h.notesActions.openNote(n);
        await h.notesActions.openNote(wsPath("m.md"));
        h.notesActions.updateText(wsPath("m.md"), "2 edited");
        const closed = await h.notesActions.closeTab(wsPath("m.md"));
        expect(closed.ok).toBe(true);
        const raw = await fs.readText(wsPath("m.md"));
        expect(raw.ok && raw.value).toBe("2 edited");
        const state = h.notesStore.getState();
        expect(state.openNotes.map((s) => s.path)).toEqual(["n.md"]);
        expect(state.activeNote).toBe("n.md");
    });

    it("keeps the tab and text when the flush fails, and closes with discard", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "1" });
        await h.notesActions.openNote(n);
        h.notesActions.updateText(n, "typed");
        fs.failNextWrite();
        const closed = await h.notesActions.closeTab(n);
        expect(closed.ok).toBe(false);
        expect(session(h).text).toBe("typed");
        const discarded = await h.notesActions.closeTab(n, { discard: true });
        expect(discarded.ok).toBe(true);
        expect(h.notesStore.getState().openNotes).toEqual([]);
        expect(h.notesStore.getState().activeNote).toBeNull();
        const raw = await fs.readText(n);
        expect(raw.ok && raw.value).toBe("1");
    });

    it("closes a clean tab with a paused error without flushing", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "1" });
        await h.notesActions.openNote(n);
        fs.externalDelete(n);
        h.notesActions.updateText(n, "2");
        await h.notesActions.saveNow(n);
        h.notesActions.updateText(n, "1");
        const closed = await h.notesActions.closeTab(n);
        expect(closed.ok).toBe(true);
    });

    it("persists openNotes and activeNote per workspace in settings", async () => {
        const { h } = await openWorkspace({ "n.md": "1", "m.md": "2" });
        await h.notesActions.openNote(n);
        await h.notesActions.openNote(wsPath("m.md"));
        await h.notesActions.openNote(n);
        expect(h.persisted().workspaces[A]).toEqual({
            openNotes: ["n.md", "m.md"],
            activeNote: "n.md",
        });
        await h.notesActions.closeTab(n);
        expect(h.persisted().workspaces[A]).toEqual({
            openNotes: ["m.md"],
            activeNote: "m.md",
        });
        await h.notesActions.closeTab(wsPath("m.md"));
        expect(h.persisted().workspaces[A]).toEqual({
            openNotes: [],
            activeNote: null,
        });
    });

    it("restores tabs, drops missing entries and falls back when the active one is gone", async () => {
        const { h } = await openWorkspace(
            { "n.md": "1", "m.md": "2" },
            {},
            {
                ...defaultAppSettings(),
                workspaces: {
                    [A]: {
                        openNotes: [
                            wsPath("gone.md"),
                            wsPath("m.md"),
                            wsPath("n.md"),
                        ],
                        activeNote: null,
                    },
                    "/other": {
                        openNotes: [wsPath("x.md")],
                        activeNote: wsPath("x.md"),
                    },
                },
            },
        );
        const state = h.notesStore.getState();
        expect(state.openNotes.map((s) => s.path)).toEqual(["m.md", "n.md"]);
        expect(state.activeNote).toBe("m.md");
        expect(h.persisted().workspaces[A]).toEqual({
            openNotes: ["m.md", "n.md"],
            activeNote: "m.md",
        });
        expect(h.persisted().workspaces["/other"]?.openNotes).toEqual(["x.md"]);
    });

    it("keeps the stored active note when it is still open", async () => {
        const { h } = await openWorkspace(
            { "n.md": "1", "m.md": "2" },
            {},
            {
                ...defaultAppSettings(),
                workspaces: {
                    [A]: {
                        openNotes: [wsPath("n.md"), wsPath("m.md")],
                        activeNote: wsPath("m.md"),
                    },
                },
            },
        );
        expect(h.notesStore.getState().activeNote).toBe("m.md");
    });
});
