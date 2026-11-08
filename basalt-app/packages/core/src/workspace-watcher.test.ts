import { describe, expect, it } from "vitest";
import { createInMemoryWorkspaceFileSystem } from "./testing";
import { createNotes } from "./notes";
import {
    batchAffectsNoteList,
    createWorkspaceWatcher,
    resolveOpenNoteChange,
} from "./workspace-watcher";
import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

const DEBOUNCE = 300;

function path(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(`expected valid path: ${input}`);
    return result.value;
}

const encode = (text: string) => new TextEncoder().encode(text);

function createFakeScheduler() {
    let now = 0;
    let nextId = 0;
    const timers = new Map<number, { at: number; run: () => void }>();
    return {
        schedule(run: () => void, delayMs: number) {
            const id = nextId++;
            timers.set(id, { at: now + delayMs, run });
            return () => {
                timers.delete(id);
            };
        },
        pending: () => timers.size,
        advance(ms: number) {
            now += ms;
            for (const [id, timer] of [...timers]) {
                if (timer.at <= now && timers.delete(id)) timer.run();
            }
        },
    };
}

async function setupWatcher(options: { failWatch?: boolean } = {}) {
    const memory = createInMemoryWorkspaceFileSystem(options);
    const scheduler = createFakeScheduler();
    const watcher = createWorkspaceWatcher({
        fs: memory,
        schedule: scheduler.schedule,
        debounceMs: DEBOUNCE,
    });
    const batches: Array<readonly WorkspacePath[]> = [];
    let rootLost = 0;
    const mode = await watcher.start({
        onBatch: (paths) => batches.push(paths),
        onRootLost: () => {
            rootLost += 1;
        },
    });
    return {
        memory,
        scheduler,
        watcher,
        batches,
        mode,
        rootLostCount: () => rootLost,
    };
}

describe("createWorkspaceWatcher", () => {
    it("reports live mode when watching starts", async () => {
        const { mode } = await setupWatcher();
        expect(mode).toBe("live");
    });

    it("batches events within the debounce window and deduplicates paths", async () => {
        const { memory, scheduler, batches } = await setupWatcher();
        memory.externalWrite(path("a.md"), encode("1"));
        scheduler.advance(DEBOUNCE - 1);
        memory.externalWrite(path("a.md"), encode("2"));
        memory.externalWrite(path("b.md"), encode("3"));
        scheduler.advance(1);
        expect(batches).toEqual([[path("a.md"), path("b.md")]]);
    });

    it("starts a new batch for events after a flush", async () => {
        const { memory, scheduler, batches } = await setupWatcher();
        memory.externalWrite(path("a.md"), encode("1"));
        scheduler.advance(DEBOUNCE);
        memory.externalWrite(path("b.md"), encode("2"));
        scheduler.advance(DEBOUNCE);
        expect(batches).toEqual([[path("a.md")], [path("b.md")]]);
    });

    it("emits nothing before the debounce elapses", async () => {
        const { memory, scheduler, batches } = await setupWatcher();
        memory.externalWrite(path("a.md"), encode("1"));
        scheduler.advance(DEBOUNCE - 1);
        expect(batches).toEqual([]);
    });

    it("propagates root loss and drops the pending batch", async () => {
        const { memory, scheduler, batches, rootLostCount } =
            await setupWatcher();
        memory.externalWrite(path("a.md"), encode("1"));
        memory.removeRoot();
        scheduler.advance(DEBOUNCE);
        expect(rootLostCount()).toBe(1);
        expect(batches).toEqual([]);
        expect(scheduler.pending()).toBe(0);
    });

    it("reports focus-fallback without throwing when watching cannot start", async () => {
        const { mode, memory, scheduler, batches } = await setupWatcher({
            failWatch: true,
        });
        expect(mode).toBe("focus-fallback");
        memory.externalWrite(path("a.md"), encode("1"));
        scheduler.advance(DEBOUNCE);
        expect(batches).toEqual([]);
    });

    it("stops listening and cancels the pending timer", async () => {
        const { memory, scheduler, watcher, batches, rootLostCount } =
            await setupWatcher();
        memory.externalWrite(path("a.md"), encode("1"));
        expect(scheduler.pending()).toBe(1);
        await watcher.stop();
        expect(scheduler.pending()).toBe(0);
        memory.externalWrite(path("b.md"), encode("2"));
        memory.removeRoot();
        scheduler.advance(DEBOUNCE);
        expect(batches).toEqual([]);
        expect(rootLostCount()).toBe(0);
        expect(scheduler.pending()).toBe(0);
    });
});

describe("resolveOpenNoteChange", () => {
    const note = path("note.md");

    function setup(disk: string) {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(note, encode(disk));
        return { memory, notes: createNotes({ fs: memory }) };
    }

    it("ignores a batch that does not contain the open note", async () => {
        const { notes } = setup("changed");
        const outcome = await resolveOpenNoteChange({
            notes,
            changed: [path("other.md")],
            path: note,
            text: "base",
            baseText: "base",
        });
        expect(outcome).toEqual({ kind: "ignore" });
    });

    it("ignores the app's own write by content, even when the session is dirty", async () => {
        const { notes } = setup("saved");
        const outcome = await resolveOpenNoteChange({
            notes,
            changed: [note],
            path: note,
            text: "saved plus newer typing",
            baseText: "saved",
        });
        expect(outcome).toEqual({ kind: "ignore" });
    });

    it("ignores a disk change that only alters line endings or the BOM", async () => {
        const { notes } = setup("﻿one\r\ntwo\r\n");
        const outcome = await resolveOpenNoteChange({
            notes,
            changed: [note],
            path: note,
            text: "one\ntwo\n",
            baseText: "one\ntwo\n",
        });
        expect(outcome).toEqual({ kind: "ignore" });
    });

    it("reloads the disk text with its style when the session is clean", async () => {
        const { notes } = setup("﻿new\r\ntext\r\n");
        const outcome = await resolveOpenNoteChange({
            notes,
            changed: [note],
            path: note,
            text: "old",
            baseText: "old",
        });
        expect(outcome).toEqual({
            kind: "reload",
            text: "new\ntext\n",
            baseText: "new\ntext\n",
            eol: "crlf",
            bom: true,
        });
    });

    it("reports a conflict when the session is dirty and the disk differs", async () => {
        const { notes } = setup("from disk");
        const outcome = await resolveOpenNoteChange({
            notes,
            changed: [note],
            path: note,
            text: "my edit",
            baseText: "old",
        });
        expect(outcome).toEqual({ kind: "conflict" });
    });

    it("reports not-found when the file is gone", async () => {
        const { memory, notes } = setup("old");
        memory.externalDelete(note);
        const outcome = await resolveOpenNoteChange({
            notes,
            changed: [note],
            path: note,
            text: "old",
            baseText: "old",
        });
        expect(outcome).toEqual({ kind: "not-found" });
    });

    it("surfaces other read failures as errors", async () => {
        const { memory, notes } = setup("old");
        memory.externalWrite(path("folder/inner.md"), encode("x"));
        const outcome = await resolveOpenNoteChange({
            notes,
            changed: [path("folder")],
            path: path("folder"),
            text: "x",
            baseText: "x",
        });
        expect(outcome).toMatchObject({
            kind: "error",
            error: { code: "invalid-path" },
        });
    });
});

describe("batchAffectsNoteList", () => {
    it("is true when any path is Markdown", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("image.png"), encode("x"));
        memory.externalWrite(path("a.MD"), encode("x"));
        expect(
            await batchAffectsNoteList(memory, [
                path("image.png"),
                path("a.MD"),
            ]),
        ).toBe(true);
    });

    it("is false when only existing non-Markdown files changed", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("image.png"), encode("x"));
        memory.externalWrite(path("data.txt"), encode("x"));
        expect(
            await batchAffectsNoteList(memory, [
                path("image.png"),
                path("data.txt"),
            ]),
        ).toBe(false);
    });

    it("is true for a directory change", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("folder/readme.txt"), encode("x"));
        expect(await batchAffectsNoteList(memory, [path("folder")])).toBe(true);
    });

    it("is true when a non-Markdown path no longer exists", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        expect(await batchAffectsNoteList(memory, [path("gone")])).toBe(true);
    });

    it("is false for an empty batch", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        expect(await batchAffectsNoteList(memory, [])).toBe(false);
    });
});
