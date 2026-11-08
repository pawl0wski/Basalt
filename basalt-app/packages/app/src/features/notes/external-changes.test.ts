import { describe, expect, it } from "vitest";
import { createHarness, root, seedFs, settle, wsPath } from "../test-harness";
import { isDirty } from "./notes-store";

const A = root("/a");
const n = wsPath("n.md");
const m = wsPath("m.md");

const bytes = (text: string) => new TextEncoder().encode(text);

async function openWithNotes(files: Record<string, string>, paths = [n]) {
    const fs = seedFs(files);
    const h = createHarness({ workspaces: { [A]: fs }, picked: A });
    await h.workspaceActions.openWorkspace();
    for (const path of paths) await h.notesActions.openNote(path);
    return { h, fs };
}

type Harness = Awaited<ReturnType<typeof openWithNotes>>["h"];

function session(h: Harness, path = n) {
    const found = h.notesStore
        .getState()
        .openNotes.find((note) => note.path === path);
    if (!found) throw new Error("no session");
    return found;
}

async function diskText(
    fs: Awaited<ReturnType<typeof openWithNotes>>["fs"],
    path = n,
) {
    const read = await fs.readText(path);
    return read.ok ? read.value : null;
}

async function deliver(h: Harness) {
    h.watchScheduler.fire();
    await settle();
}

describe("external changes to open notes", () => {
    it("silently reloads a clean note and rebases without scheduling a save", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });

        fs.externalWrite(n, bytes("from disk"));
        await deliver(h);

        expect(session(h)).toMatchObject({
            text: "from disk",
            baseText: "from disk",
            error: null,
            saveStatus: "saved",
        });
        expect(isDirty(session(h))).toBe(false);
        expect(h.scheduler.pending()).toBe(0);
        h.scheduler.fire();
        await settle();
        expect(await diskText(fs)).toBe("from disk");
    });

    it("adopts the line ending and BOM of the reloaded file", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "a\nb" });

        fs.externalWrite(n, bytes("﻿x\r\ny"));
        await deliver(h);

        expect(session(h)).toMatchObject({
            text: "x\ny",
            eol: "crlf",
            bom: true,
        });
    });

    it("shows a conflict at once for a dirty note, pauses autosave and keeps the text", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");

        fs.externalWrite(n, bytes("theirs"));
        await deliver(h);

        expect(session(h)).toMatchObject({
            text: "mine",
            baseText: "base",
            error: { code: "conflict" },
            saveStatus: "paused",
        });
        expect(h.scheduler.pending()).toBe(0);
        h.notesActions.updateText(n, "mine more");
        h.scheduler.fire();
        await settle();
        expect(await diskText(fs)).toBe("theirs");
    });

    it("ignores the app's own save by content", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "saved by us");
        h.scheduler.fire();
        await settle();
        expect(session(h).baseText).toBe("saved by us");

        h.watchScheduler.fire();
        await settle();
        fs.externalWrite(n, bytes("saved by us"));
        await deliver(h);

        expect(session(h)).toMatchObject({
            text: "saved by us",
            error: null,
            saveStatus: "saved",
        });
    });

    it("keeps typing made while the own save event is delivered", async () => {
        const { h } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "one");
        h.scheduler.fire();
        await settle();
        h.notesActions.updateText(n, "one two");

        await deliver(h);

        expect(session(h)).toMatchObject({ text: "one two", error: null });
    });

    it("ignores an external change that only differs in line endings", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "a\nb" });
        h.notesActions.updateText(n, "a\nb!");

        fs.externalWrite(n, bytes("a\r\nb"));
        await deliver(h);

        expect(session(h)).toMatchObject({
            text: "a\nb!",
            baseText: "a\nb",
            error: null,
        });
    });

    it("shows the deleted state and never recreates the file on its own", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");

        fs.externalDelete(n);
        await deliver(h);
        h.scheduler.fire();
        await h.notesActions.flushAll();
        await settle();

        expect(session(h)).toMatchObject({
            text: "mine",
            error: { code: "not-found" },
            saveStatus: "paused",
        });
        expect(await diskText(fs)).toBeNull();
    });

    it("also pauses a clean note that was deleted", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });

        fs.externalDelete(n);
        await deliver(h);

        expect(session(h)).toMatchObject({
            text: "base",
            error: { code: "not-found" },
        });
        expect(await diskText(fs)).toBeNull();
    });

    it("applies to every open note, not only the active one", async () => {
        const { h, fs } = await openWithNotes(
            { "n.md": "n base", "m.md": "m base" },
            [n, m],
        );
        expect(h.notesStore.getState().activeNote).toBe("m.md");
        h.notesActions.updateText(n, "n mine");

        fs.externalWrite(n, bytes("n theirs"));
        fs.externalWrite(m, bytes("m theirs"));
        await deliver(h);

        expect(session(h, n)).toMatchObject({
            text: "n mine",
            error: { code: "conflict" },
        });
        expect(session(h, m)).toMatchObject({
            text: "m theirs",
            error: null,
        });
    });

    it("only checks notes whose path is in the batch", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "a", "m.md": "b" }, [
            n,
            m,
        ]);

        fs.externalWrite(wsPath("other.md"), bytes("x"));
        await deliver(h);

        expect(session(h, n).text).toBe("a");
        expect(session(h, m).text).toBe("b");
    });

    it("turns a conflict found by a save into the same conflict state", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");
        fs.externalWrite(n, bytes("theirs"));

        h.scheduler.fire();
        await settle();

        expect(session(h)).toMatchObject({
            error: { code: "conflict" },
            saveStatus: "paused",
        });
        expect(await diskText(fs)).toBe("theirs");
    });

    it("turns a missing file found by a save into the deleted state", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");
        fs.externalDelete(n);

        h.scheduler.fire();
        await settle();

        expect(session(h)).toMatchObject({ error: { code: "not-found" } });
        expect(await diskText(fs)).toBeNull();
    });

    it("keeps my version by overwriting the disk file and resumes autosave", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");
        fs.externalWrite(n, bytes("theirs"));
        await deliver(h);

        const result = await h.notesActions.keepMine(n);

        expect(result.ok).toBe(true);
        expect(await diskText(fs)).toBe("mine");
        expect(session(h)).toMatchObject({
            text: "mine",
            baseText: "mine",
            error: null,
            saveStatus: "saved",
        });
        h.notesActions.updateText(n, "mine again");
        h.scheduler.fire();
        await settle();
        expect(await diskText(fs)).toBe("mine again");
    });

    it("keeps the conflict when overwriting fails", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");
        fs.externalWrite(n, bytes("theirs"));
        await deliver(h);
        fs.failNextWrite();

        const result = await h.notesActions.keepMine(n);

        expect(result.ok).toBe(false);
        expect(await diskText(fs)).toBe("theirs");
        expect(session(h).saveStatus).toBe("paused");
    });

    it("saves again by recreating the deleted file, even when the note is clean", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        fs.externalDelete(n);
        await deliver(h);

        const result = await h.notesActions.saveAgain(n);

        expect(result.ok).toBe(true);
        expect(await diskText(fs)).toBe("base");
        expect(session(h)).toMatchObject({ error: null, saveStatus: "saved" });
    });

    it("saves again with the edited text of a dirty deleted note", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");
        fs.externalDelete(n);
        await deliver(h);

        await h.notesActions.saveAgain(n);

        expect(await diskText(fs)).toBe("mine");
        expect(isDirty(session(h))).toBe(false);
    });

    it("shows a conflict when a deleted dirty note reappears with other text", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");
        fs.externalDelete(n);
        await deliver(h);

        fs.externalWrite(n, bytes("back"));
        await deliver(h);

        expect(session(h)).toMatchObject({
            text: "mine",
            error: { code: "conflict" },
        });
    });

    it("loads the version from disk and discards local edits with reloadNote", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        h.notesActions.updateText(n, "mine");
        fs.externalWrite(n, bytes("theirs"));
        await deliver(h);

        await h.notesActions.reloadNote(n);

        expect(session(h)).toMatchObject({
            text: "theirs",
            baseText: "theirs",
            error: null,
            saveStatus: "saved",
        });
        h.scheduler.fire();
        await settle();
        expect(await diskText(fs)).toBe("theirs");
    });

    it("ignores watcher batches after leaving the workspace", async () => {
        const { h, fs } = await openWithNotes({ "n.md": "base" });
        await h.workspaceActions.leaveWorkspace();

        fs.externalWrite(n, bytes("late"));
        await h.notesActions.handleExternalChanges([n]);

        expect(h.notesStore.getState().openNotes).toEqual([]);
    });
});
