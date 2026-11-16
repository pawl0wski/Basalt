import { describe, expect, it } from "vitest";
import { defaultAppSettings, err, type AppSettings } from "@basalt/core";
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
        expect(h.notesStore.getState().createError?.code).toBe(
            "permission-denied",
        );
    });

    it("clears the create error after a later successful create", async () => {
        const { h } = await openWorkspace({});
        h.notesStore.setState({
            createError: { code: "permission-denied", message: "ro" },
        });
        const created = await h.notesActions.createNote();
        expect(created.ok).toBe(true);
        expect(h.notesStore.getState().createError).toBeNull();
    });

    it("creates distinct notes when called twice at once", async () => {
        const { h } = await openWorkspace({});
        const results = await Promise.all([
            h.notesActions.createNote(),
            h.notesActions.createNote(),
        ]);
        expect(results.map((r) => r.ok && r.value.name)).toEqual([
            "Untitled",
            "Untitled 1",
        ]);
        expect(h.notesStore.getState().createError).toBeNull();
    });

    it("does not list a note twice when a refresh already saw it", async () => {
        const { h } = await openWorkspace({});
        const created = h.notesActions.createNote();
        await h.notesActions.refreshNotes();
        await created;
        expect(h.notesStore.getState().notes.map((note) => note.path)).toEqual([
            "Untitled.md",
        ]);
    });
});

describe("the notes tree", () => {
    it("lists notes of sub folders and empty folders, hides attachments, dot entries and other files", async () => {
        const { h, fs } = await openWorkspace({
            "Welcome.md": "",
            "projects/Roadmap.md": "",
            "projects/2026/Plan.md": "",
            "attachments/readme.md": "",
            "attachments/a.png": "",
            ".hidden/x.md": "",
            "data.txt": "",
        });
        await fs.mkdir(wsPath("empty"));
        await h.notesActions.refreshNotes();

        const state = h.notesStore.getState();
        expect(state.tree.map((node) => `${node.kind}:${node.name}`)).toEqual([
            "folder:empty",
            "folder:projects",
            "note:Welcome",
        ]);
        expect(state.notes.map((note) => note.path)).toEqual([
            "projects/2026/Plan.md",
            "projects/Roadmap.md",
            "Welcome.md",
        ]);
        expect(state.notes.map((note) => note.name)).toEqual([
            "Plan",
            "Roadmap",
            "Welcome",
        ]);
    });

    it("keeps the previous tree and sets the list error when listing fails", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "" });
        const before = h.notesStore.getState().tree;
        fs.list = () =>
            Promise.resolve(err({ code: "unknown", message: "boom" }));

        const result = await h.notesActions.refreshNotes();

        expect(result.ok).toBe(false);
        expect(h.notesStore.getState().listError).not.toBeNull();
        expect(h.notesStore.getState().tree).toBe(before);
    });

    it("creates Untitled inside a folder, opens it and expands the folder", async () => {
        const { h, fs } = await openWorkspace({
            "docs/Untitled.md": "",
            "Untitled.md": "",
        });

        const created = await h.notesActions.createNote({
            folder: wsPath("docs"),
        });

        expect(created.ok && created.value.path).toBe("docs/Untitled 1.md");
        expect(h.notesStore.getState().activeNote).toBe("docs/Untitled 1.md");
        expect(h.notesStore.getState().focusRequest?.path).toBe(
            "docs/Untitled 1.md",
        );
        expect(h.treeStore.getState().expanded.has("docs")).toBe(true);
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((e) => e.path).sort()).toEqual([
            "Untitled.md",
            "docs",
            "docs/Untitled 1.md",
            "docs/Untitled.md",
        ]);
    });

    it("creates in the root when no folder is given", async () => {
        const { h } = await openWorkspace({ "docs/Untitled.md": "" });
        const created = await h.notesActions.createNote();
        expect(created.ok && created.value.path).toBe("Untitled.md");
    });

    it("creates nothing in a read-only workspace folder and reports permission-denied", async () => {
        const { h, fs } = await openWorkspace(
            { "docs/a.md": "" },
            { readOnly: true },
        );
        const created = await h.notesActions.createNote({
            folder: wsPath("docs"),
        });
        expect(!created.ok && created.error.code).toBe("permission-denied");
        expect(h.notesStore.getState().createError?.code).toBe(
            "permission-denied",
        );
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((e) => e.path).sort()).toEqual([
            "docs",
            "docs/a.md",
        ]);
        expect(h.notesStore.getState().openNotes).toEqual([]);
    });

    it("expands the folders of a restored active note", async () => {
        const { h } = await openWorkspace(
            { "a/b/c.md": "x" },
            {},
            {
                ...defaultAppSettings(),
                lastWorkspace: A,
                workspaces: {
                    [A]: {
                        openNotes: [wsPath("a/b/c.md")],
                        activeNote: wsPath("a/b/c.md"),
                    },
                },
            },
        );
        expect([...h.treeStore.getState().expanded].sort()).toEqual([
            "a",
            "a/b",
        ]);
    });
});

describe("creating folders", () => {
    it("creates the folder and shows it in the tree, empty", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "" });

        const created = await h.notesActions.createFolder(null, "Ideas");

        expect(created.ok && created.value).toBe("Ideas");
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((e) => e.path).sort()).toEqual([
            "Ideas",
            "a.md",
        ]);
        expect(h.notesStore.getState().tree[0]).toMatchObject({
            kind: "folder",
            name: "Ideas",
            children: [],
        });
    });

    it("creates a nested folder inside a folder", async () => {
        const { h } = await openWorkspace({ "docs/a.md": "" });

        const created = await h.notesActions.createFolder(
            wsPath("docs"),
            "2026",
        );

        expect(created.ok && created.value).toBe("docs/2026");
    });

    it("fails with already-exists for a case-only collision and leaves the tree alone", async () => {
        const { h, fs } = await openWorkspace({ "docs/a.md": "" });
        const before = h.notesStore.getState().tree;

        const created = await h.notesActions.createFolder(null, "DOCS");

        expect(!created.ok && created.error.code).toBe("already-exists");
        expect(h.notesStore.getState().tree).toBe(before);
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((e) => e.path).sort()).toEqual([
            "docs",
            "docs/a.md",
        ]);
    });

    it("fails with permission-denied in a read-only workspace and creates nothing", async () => {
        const { h, fs } = await openWorkspace(
            { "a.md": "" },
            { readOnly: true },
        );

        const created = await h.notesActions.createFolder(null, "Ideas");

        expect(!created.ok && created.error.code).toBe("permission-denied");
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((e) => e.path)).toEqual(["a.md"]);
        expect(h.notesStore.getState().tree).toHaveLength(1);
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

describe("editor focus and open failures", () => {
    it("requests focus only when asked and counts requests per open", async () => {
        const { h } = await openWorkspace({ "n.md": "1", "m.md": "2" });

        await h.notesActions.openNote(n);
        expect(h.notesStore.getState().focusRequest).toBeNull();

        await h.notesActions.openNote(n, { focus: true });
        await h.notesActions.openNote(wsPath("m.md"), { focus: true });

        expect(h.notesStore.getState().focusRequest).toEqual({
            path: "m.md",
            id: 2,
        });
    });

    it("does not request focus for restored tabs", async () => {
        const { h } = await openWorkspace(
            { "n.md": "1" },
            {},
            {
                ...defaultAppSettings(),
                workspaces: { [A]: { openNotes: [n], activeNote: n } },
            },
        );

        expect(h.notesStore.getState().focusRequest).toBeNull();
    });

    it("requests focus for a note created with createNote", async () => {
        const { h } = await openWorkspace({});

        await h.notesActions.createNote();

        expect(h.notesStore.getState().focusRequest).toEqual({
            path: "Untitled.md",
            id: 1,
        });
    });

    it("marks an unreadable note as openFailed and never asks to focus it", async () => {
        const { h, fs } = await openWorkspace({});
        fs.externalWrite(wsPath("bin.md"), new Uint8Array([0xff, 0xfe]));

        await h.notesActions.openNote(wsPath("bin.md"), { focus: true });

        const failed = h.notesStore.getState().openNotes[0];
        expect(failed?.openFailed).toBe(true);
        expect(failed?.error?.code).toBe("not-utf8");
        expect(h.notesStore.getState().focusRequest).toBeNull();
    });

    it("does not mark a save failure as an open failure", async () => {
        const { h, fs } = await openWorkspace({ "n.md": "1" });
        await h.notesActions.openNote(n);
        h.notesActions.updateText(n, "2");
        fs.failNextWrite();

        await h.notesActions.saveNow(n);

        expect(session(h).error).not.toBeNull();
        expect(session(h).openFailed).toBe(false);
    });
});

describe("renaming and moving open notes", () => {
    const m = wsPath("m.md");

    async function open(files: Record<string, string>, paths: string[]) {
        const context = await openWorkspace(files);
        for (const path of paths) {
            await context.h.notesActions.openNote(wsPath(path));
        }
        return context;
    }

    function tabs(h: Awaited<ReturnType<typeof openWorkspace>>["h"]) {
        const { openNotes, activeNote } = h.notesStore.getState();
        return { paths: openNotes.map((note) => note.path), activeNote };
    }

    async function readDisk(
        fs: Awaited<ReturnType<typeof openWorkspace>>["fs"],
        path: string,
    ) {
        const result = await fs.readText(wsPath(path));
        return result.ok ? result.value : null;
    }

    describe("renamePath", () => {
        it("moves the tab, the active note, the focus request and the persisted settings", async () => {
            const { h } = await open({ "n.md": "1", "m.md": "2" }, [
                "n.md",
                "m.md",
            ]);
            await h.notesActions.openNote(n, { focus: true });

            await h.notesActions.renamePath(n, wsPath("d/x.md"));

            expect(tabs(h)).toEqual({
                paths: ["d/x.md", "m.md"],
                activeNote: "d/x.md",
            });
            expect(h.notesStore.getState().focusRequest?.path).toBe("d/x.md");
            expect(h.persisted().workspaces[A]).toEqual({
                openNotes: ["d/x.md", "m.md"],
                activeNote: "d/x.md",
            });
        });

        it("keeps the active note when another tab is renamed", async () => {
            const { h } = await open({ "n.md": "1", "m.md": "2" }, [
                "n.md",
                "m.md",
            ]);

            await h.notesActions.renamePath(n, wsPath("z.md"));

            expect(tabs(h).activeNote).toBe("m.md");
        });

        it("makes autosave write to the new path and never to the old one", async () => {
            const { h, fs } = await open({ "n.md": "1" }, ["n.md"]);
            const x = wsPath("x.md");
            await fs.rename(n, x);

            await h.notesActions.renamePath(n, x);
            h.notesActions.updateText(x, "edited");
            h.scheduler.fire();
            await settle();

            expect(await readDisk(fs, "x.md")).toBe("edited");
            expect((await fs.stat(n)).ok).toBe(false);
            expect(h.notesStore.getState().openNotes[0]).toMatchObject({
                path: "x.md",
                error: null,
                saveStatus: "saved",
            });
        });

        it("renames a tab that failed to open and a path with only a case change", async () => {
            const { h, fs } = await openWorkspace({});
            fs.externalWrite(n, new Uint8Array([0xff]));
            await h.notesActions.openNote(n);

            await h.notesActions.renamePath(n, wsPath("N.md"));

            expect(tabs(h)).toEqual({ paths: ["N.md"], activeNote: "N.md" });
            expect(h.notesStore.getState().openNotes[0]?.openFailed).toBe(true);
        });

        it("does nothing for an unknown path or an unchanged path", async () => {
            const { h } = await open({ "n.md": "1" }, ["n.md"]);
            const before = h.saves.length;

            await h.notesActions.renamePath(wsPath("other.md"), wsPath("x.md"));
            await h.notesActions.renamePath(n, n);

            expect(tabs(h)).toEqual({ paths: ["n.md"], activeNote: "n.md" });
            expect(h.saves.length).toBeGreaterThanOrEqual(before);
        });
    });

    describe("renameNote", () => {
        it("renames on disk, keeps the tab active and refreshes the list", async () => {
            const { h, fs } = await open({ "n.md": "body" }, ["n.md"]);

            const result = await h.notesActions.renameNote(n, "Renamed");

            expect(result).toEqual({ ok: true, value: "Renamed.md" });
            expect(await readDisk(fs, "Renamed.md")).toBe("body");
            expect((await fs.stat(n)).ok).toBe(false);
            expect(tabs(h)).toEqual({
                paths: ["Renamed.md"],
                activeNote: "Renamed.md",
            });
            expect(
                h.notesStore.getState().notes.map((note) => note.path),
            ).toEqual(["Renamed.md"]);
            expect(h.persisted().workspaces[A]).toEqual({
                openNotes: ["Renamed.md"],
                activeNote: "Renamed.md",
            });
        });

        it("flushes unsaved text before renaming so no edit is lost", async () => {
            const { h, fs } = await open({ "n.md": "old" }, ["n.md"]);
            h.notesActions.updateText(n, "typed just now");

            const result = await h.notesActions.renameNote(n, "b");

            expect(result.ok).toBe(true);
            expect(await readDisk(fs, "b.md")).toBe("typed just now");
            expect(h.notesStore.getState().openNotes[0]).toMatchObject({
                path: "b.md",
                text: "typed just now",
                baseText: "typed just now",
                saveStatus: "saved",
            });
        });

        it("cancels the rename when the flush fails and keeps the text", async () => {
            const { h, fs } = await open({ "n.md": "old" }, ["n.md"]);
            h.notesActions.updateText(n, "typed");
            fs.failNextWrite();

            const result = await h.notesActions.renameNote(n, "b");

            expect(result.ok).toBe(false);
            expect((await fs.stat(n)).ok).toBe(true);
            expect((await fs.stat(wsPath("b.md"))).ok).toBe(false);
            expect(tabs(h)).toEqual({ paths: ["n.md"], activeNote: "n.md" });
            expect(h.notesStore.getState().openNotes[0]?.text).toBe("typed");
        });

        it("cancels the rename with a conflict when the note changed on disk", async () => {
            const { h, fs } = await open({ "n.md": "old" }, ["n.md"]);
            h.notesActions.updateText(n, "mine");
            fs.externalWrite(n, new TextEncoder().encode("theirs"));

            const result = await h.notesActions.renameNote(n, "b");

            expect(!result.ok && result.error.code).toBe("conflict");
            expect(await readDisk(fs, "n.md")).toBe("theirs");
            expect(tabs(h).paths).toEqual(["n.md"]);
        });

        it("reports a collision and leaves everything as it was", async () => {
            const { h, fs } = await open({ "n.md": "1", "Taken.md": "2" }, [
                "n.md",
            ]);
            const saves = h.saves.length;

            const result = await h.notesActions.renameNote(n, "taken");

            expect(!result.ok && result.error.code).toBe("already-exists");
            expect(await readDisk(fs, "n.md")).toBe("1");
            expect(tabs(h)).toEqual({ paths: ["n.md"], activeNote: "n.md" });
            expect(h.saves).toHaveLength(saves);
        });

        it("reports the invalid name without touching the tab", async () => {
            const { h } = await open({ "n.md": "1" }, ["n.md"]);

            const result = await h.notesActions.renameNote(n, "a/b");

            expect(!result.ok && result.error.code).toBe("invalid-path");
            expect(tabs(h).paths).toEqual(["n.md"]);
        });

        it("renames a note that is not open without opening a tab", async () => {
            const { h, fs } = await open({ "n.md": "1", "m.md": "2" }, [
                "m.md",
            ]);

            const result = await h.notesActions.renameNote(n, "k");

            expect(result.ok).toBe(true);
            expect((await fs.stat(wsPath("k.md"))).ok).toBe(true);
            expect(tabs(h)).toEqual({ paths: ["m.md"], activeNote: "m.md" });
        });

        it("reports permission-denied in a read-only workspace and changes nothing", async () => {
            const readOnly = seedFs({ "n.md": "1" }, { readOnly: true });
            const h = createHarness({
                workspaces: { [A]: readOnly },
                picked: A,
            });
            await h.workspaceActions.openWorkspace();
            await h.notesActions.openNote(n);

            const result = await h.notesActions.renameNote(n, "b");

            expect(!result.ok && result.error.code).toBe("permission-denied");
            expect(tabs(h).paths).toEqual(["n.md"]);
        });

        it("fails without a workspace", async () => {
            const h = createHarness();

            const result = await h.notesActions.renameNote(n, "b");

            expect(!result.ok && result.error.code).toBe("unavailable");
        });

        it("ignores the watcher batch caused by its own rename", async () => {
            const { h, fs } = await open({ "n.md": "body" }, ["n.md"]);

            await h.notesActions.renameNote(n, "b");
            h.watchScheduler.fire();
            await settle();

            expect(h.notesStore.getState().openNotes[0]).toMatchObject({
                path: "b.md",
                text: "body",
                error: null,
                saveStatus: "saved",
            });
            expect(await readDisk(fs, "b.md")).toBe("body");
        });

        it("ignores a watcher batch that arrives while its own rename is in progress", async () => {
            const base = seedFs({ "n.md": "body" });
            let notify: () => Promise<void> = async () => {};
            const fs = {
                ...base,
                async rename(
                    from: Parameters<typeof base.rename>[0],
                    to: Parameters<typeof base.rename>[1],
                ) {
                    const result = await base.rename(from, to);
                    await notify();
                    return result;
                },
            };
            const h = createHarness({ workspaces: { [A]: fs }, picked: A });
            await h.workspaceActions.openWorkspace();
            await h.notesActions.openNote(n);
            notify = () =>
                h.notesActions.handleExternalChanges([n, wsPath("b.md")]);

            const result = await h.notesActions.renameNote(n, "b");

            expect(result.ok).toBe(true);
            expect(h.notesStore.getState().openNotes[0]).toMatchObject({
                path: "b.md",
                error: null,
            });
        });
    });

    describe("moveNotes", () => {
        it("moves open notes, their tabs follow and the selection of tabs is kept", async () => {
            const { h, fs } = await open(
                { "n.md": "1", "m.md": "2", "d/keep.md": "3" },
                ["n.md", "m.md", "d/keep.md"],
            );
            await h.notesActions.openNote(m);

            const result = await h.notesActions.moveNotes([n, m], wsPath("d"));

            expect(result).toEqual({
                ok: true,
                value: [
                    { from: "n.md", to: "d/n.md" },
                    { from: "m.md", to: "d/m.md" },
                ],
            });
            expect(tabs(h)).toEqual({
                paths: ["d/n.md", "d/m.md", "d/keep.md"],
                activeNote: "d/m.md",
            });
            expect(h.persisted().workspaces[A]).toEqual({
                openNotes: ["d/n.md", "d/m.md", "d/keep.md"],
                activeNote: "d/m.md",
            });
            expect((await fs.stat(n)).ok).toBe(false);
            expect(
                h.notesStore.getState().notes.map((note) => note.path),
            ).toEqual(["d/keep.md", "d/m.md", "d/n.md"]);
        });

        it("flushes unsaved text of a moved note first", async () => {
            const { h, fs } = await open({ "n.md": "old" }, ["n.md"]);
            await fs.mkdir(wsPath("d"));
            h.notesActions.updateText(n, "typed");

            const result = await h.notesActions.moveNotes([n], wsPath("d"));

            expect(result.ok).toBe(true);
            expect(await readDisk(fs, "d/n.md")).toBe("typed");
        });

        it("cancels the move when a flush fails", async () => {
            const { h, fs } = await open({ "n.md": "old", "m.md": "x" }, [
                "n.md",
            ]);
            await fs.mkdir(wsPath("d"));
            h.notesActions.updateText(n, "typed");
            fs.failNextWrite();

            const result = await h.notesActions.moveNotes([n, m], wsPath("d"));

            expect(result.ok).toBe(false);
            expect((await fs.stat(n)).ok).toBe(true);
            expect((await fs.stat(m)).ok).toBe(true);
            expect(tabs(h).paths).toEqual(["n.md"]);
            expect(h.notesStore.getState().createError).toEqual(
                !result.ok ? result.error : null,
            );
            expect(h.notesStore.getState().createError).not.toBeNull();
        });

        it("shows the rewritten links in the open editor after the watcher batch", async () => {
            const { h, fs } = await open({ "n.md": "[a](x.md)" }, ["n.md"]);
            await fs.mkdir(wsPath("d"));

            await h.notesActions.moveNotes([n], wsPath("d"));
            h.watchScheduler.fire();
            await settle();

            expect(await readDisk(fs, "d/n.md")).toBe("[a](../x.md)");
            expect(h.notesStore.getState().openNotes[0]).toMatchObject({
                path: "d/n.md",
                text: "[a](../x.md)",
                baseText: "[a](../x.md)",
                error: null,
            });
        });

        it("moves nothing and keeps every tab when a name collides", async () => {
            const { h, fs } = await open(
                { "n.md": "1", "m.md": "2", "d/M.md": "taken" },
                ["n.md", "m.md"],
            );

            const result = await h.notesActions.moveNotes([n, m], wsPath("d"));

            expect(!result.ok && result.error.code).toBe("already-exists");
            expect(!result.ok && result.error.message).toContain("m.md");
            expect(h.notesStore.getState().createError?.detail).toEqual({
                kind: "move-collision",
                name: "m.md",
            });
            expect((await fs.stat(n)).ok).toBe(true);
            expect(tabs(h).paths).toEqual(["n.md", "m.md"]);
        });

        it("keeps tabs of notes that were moved before a failure and the others unchanged", async () => {
            const base = seedFs({ "n.md": "1", "m.md": "2" });
            await base.mkdir(wsPath("d"));
            let calls = 0;
            const fs = {
                ...base,
                async rename(
                    from: Parameters<typeof base.rename>[0],
                    to: Parameters<typeof base.rename>[1],
                ) {
                    calls += 1;
                    if (calls === 2) {
                        return {
                            ok: false as const,
                            error: {
                                code: "unknown" as const,
                                message: "disk",
                            },
                        };
                    }
                    return base.rename(from, to);
                },
            };
            const h = createHarness({ workspaces: { [A]: fs }, picked: A });
            await h.workspaceActions.openWorkspace();
            await h.notesActions.openNote(n);
            await h.notesActions.openNote(m);

            const result = await h.notesActions.moveNotes([n, m], wsPath("d"));

            expect(!result.ok && result.error.message).toContain(
                "Moved 1 of 2",
            );
            expect(tabs(h)).toEqual({
                paths: ["d/n.md", "m.md"],
                activeNote: "m.md",
            });
            expect(h.persisted().workspaces[A]?.openNotes).toEqual([
                "d/n.md",
                "m.md",
            ]);
            expect(
                h.notesStore.getState().notes.map((note) => note.path),
            ).toEqual(["d/n.md", "m.md"]);
        });

        it("clears an earlier error after a successful move", async () => {
            const { h, fs } = await open(
                { "n.md": "1", "m.md": "2", "d/M.md": "x" },
                [],
            );
            await h.notesActions.moveNotes([m], wsPath("d"));
            expect(h.notesStore.getState().createError).not.toBeNull();

            await h.notesActions.moveNotes([n], wsPath("d"));

            expect(h.notesStore.getState().createError).toBeNull();
            expect((await fs.stat(wsPath("d/n.md"))).ok).toBe(true);
        });

        it("reports permission-denied in a read-only workspace as the sidebar error", async () => {
            const { h, fs } = await openWorkspace(
                { "n.md": "1", "d/x.md": "" },
                { readOnly: true },
            );

            await h.notesActions.moveNotes([n], wsPath("d"));

            expect(h.notesStore.getState().createError?.code).toBe(
                "permission-denied",
            );
            expect((await fs.stat(n)).ok).toBe(true);
        });

        it("does nothing when the note is already in the destination", async () => {
            const { h, fs } = await open({ "d/n.md": "1" }, ["d/n.md"]);

            const result = await h.notesActions.moveNotes(
                [wsPath("d/n.md")],
                wsPath("d"),
            );

            expect(result).toEqual({ ok: true, value: [] });
            expect(tabs(h).paths).toEqual(["d/n.md"]);
            expect((await fs.stat(wsPath("d/n.md"))).ok).toBe(true);
        });

        it("moves to the workspace root with null and follows the tab", async () => {
            const { h } = await open({ "d/n.md": "1" }, ["d/n.md"]);

            const result = await h.notesActions.moveNotes(
                [wsPath("d/n.md")],
                null,
            );

            expect(result.ok).toBe(true);
            expect(tabs(h)).toEqual({ paths: ["n.md"], activeNote: "n.md" });
        });

        it("reports permission-denied in a read-only workspace and changes nothing", async () => {
            const readOnly = seedFs(
                { "n.md": "1", "d/x.md": "2" },
                { readOnly: true },
            );
            const h = createHarness({
                workspaces: { [A]: readOnly },
                picked: A,
            });
            await h.workspaceActions.openWorkspace();
            await h.notesActions.openNote(n);

            const result = await h.notesActions.moveNotes([n], wsPath("d"));

            expect(!result.ok && result.error.code).toBe("permission-denied");
            expect(tabs(h)).toEqual({ paths: ["n.md"], activeNote: "n.md" });
        });
    });
});

describe("deleting notes", () => {
    it("deletes the notes, closes their tabs and refreshes the tree", async () => {
        const { h, fs } = await openWorkspace({
            "a.md": "1",
            "b.md": "2",
            "c.md": "3",
        });
        await h.notesActions.openNote(wsPath("a.md"));
        await h.notesActions.openNote(wsPath("b.md"));

        const result = await h.notesActions.deleteNotes([
            wsPath("a.md"),
            wsPath("b.md"),
        ]);

        expect(result.ok && result.value.deleted).toEqual(["a.md", "b.md"]);
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((entry) => entry.path)).toEqual([
            "c.md",
        ]);
        expect(h.notesStore.getState().openNotes).toEqual([]);
        expect(h.notesStore.getState().activeNote).toBeNull();
        expect(h.notesStore.getState().notes.map((note) => note.path)).toEqual([
            "c.md",
        ]);
    });

    it("closes the active tab and activates a neighbour", async () => {
        const { h } = await openWorkspace({
            "a.md": "1",
            "b.md": "2",
            "c.md": "3",
        });
        await h.notesActions.openNote(wsPath("a.md"));
        await h.notesActions.openNote(wsPath("c.md"));
        await h.notesActions.openNote(wsPath("b.md"));

        await h.notesActions.deleteNotes([wsPath("b.md")]);

        const { openNotes, activeNote } = h.notesStore.getState();
        expect(openNotes.map((note) => note.path)).toEqual(["a.md", "c.md"]);
        expect(activeNote).toBe("c.md");
    });

    it("keeps the note and reports permission-denied when the trash refuses", async () => {
        const { h, fs } = await openWorkspace({ "a.md": "1" });
        await h.notesActions.openNote(wsPath("a.md"));
        h.setTrashReadOnly(true);

        const result = await h.notesActions.deleteNotes([wsPath("a.md")]);

        expect(result.ok && result.value.deleted).toEqual([]);
        expect(result.ok && result.value.failed[0]?.error.code).toBe(
            "permission-denied",
        );
        const listed = await fs.list();
        expect(listed.ok && listed.value.map((entry) => entry.path)).toEqual([
            "a.md",
        ]);
        expect(
            h.notesStore.getState().openNotes.map((note) => note.path),
        ).toEqual(["a.md"]);
    });
});
