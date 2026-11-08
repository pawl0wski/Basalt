import { describe, expect, it } from "vitest";
import { defaultAppSettings, err } from "@basalt/core";
import { createHarness, root, seedFs, wsPath } from "../test-harness";

const A = root("/a");
const B = root("/b");

describe("workspace actions", () => {
    it("opens a picked workspace, lists notes sorted and persists lastWorkspace", async () => {
        const h = createHarness({
            workspaces: {
                [A]: seedFs({ "b.md": "", "A.md": "", "skip.txt": "" }),
            },
            picked: A,
        });
        const result = await h.workspaceActions.openWorkspace();
        expect(result.ok).toBe(true);
        expect(h.workspaceStore.getState()).toMatchObject({
            root: A,
            status: "open",
            error: null,
            notice: null,
            watchMode: "live",
        });
        expect(h.notesStore.getState().notes.map((n) => n.name)).toEqual([
            "A",
            "b",
        ]);
        expect(h.persisted().lastWorkspace).toBe(A);
    });

    it("changes nothing and reports no error when the picker is cancelled", async () => {
        const h = createHarness({ picked: null });
        const before = h.workspaceStore.getState();
        const result = await h.workspaceActions.openWorkspace();
        expect(result.ok).toBe(true);
        expect(h.workspaceStore.getState()).toEqual(before);
        expect(h.saves).toEqual([]);
    });

    it("stays on welcome with the error when the picked folder cannot be opened", async () => {
        const h = createHarness({ picked: A });
        const result = await h.workspaceActions.openWorkspace();
        expect(result.ok).toBe(false);
        expect(h.workspaceStore.getState()).toMatchObject({
            root: null,
            status: "welcome",
            error: { code: "not-found" },
        });
        expect(h.persisted().lastWorkspace).toBeNull();
    });

    it("reports a picker failure as an error", async () => {
        const h = createHarness({ pickError: true });
        await h.workspaceActions.openWorkspace();
        expect(h.workspaceStore.getState().error?.code).toBe("unknown");
        expect(h.workspaceStore.getState().status).toBe("welcome");
    });

    it("keeps the workspace working when basalt.json cannot be written", async () => {
        const h = createHarness({
            workspaces: { [A]: seedFs({ "n.md": "" }) },
            picked: A,
            failSettingsSave: true,
        });
        const result = await h.workspaceActions.openWorkspace();
        expect(result.ok).toBe(true);
        expect(h.workspaceStore.getState().status).toBe("open");
        expect(h.notesStore.getState().notes).toHaveLength(1);
    });

    it("keeps an unreadable list as a list error while the workspace opens", async () => {
        const fs = seedFs({ "n.md": "" });
        const list = fs.list.bind(fs);
        let fail = true;
        fs.list = () =>
            fail
                ? Promise.resolve(err({ code: "unknown", message: "boom" }))
                : list();
        const h = createHarness({ workspaces: { [A]: fs }, picked: A });
        await h.workspaceActions.openWorkspace();
        expect(h.workspaceStore.getState().status).toBe("open");
        expect(h.notesStore.getState().listError?.code).toBe("unknown");
        fail = false;
        expect((await h.notesActions.refreshNotes()).ok).toBe(true);
        expect(h.notesStore.getState().listError).toBeNull();
        expect(h.notesStore.getState().notes).toHaveLength(1);
    });

    it("switches workspace: flushes pending text first and loads the other tabs", async () => {
        const fsA = seedFs({ "a.md": "one" });
        const h = createHarness({
            workspaces: { [A]: fsA, [B]: seedFs({ "b.md": "two" }) },
            picked: A,
        });
        await h.workspaceActions.openWorkspace();
        await h.notesActions.openNote(wsPath("a.md"));
        h.notesActions.updateText(wsPath("a.md"), "one edited");
        h.pick(B);
        const result = await h.workspaceActions.openWorkspace();
        expect(result.ok).toBe(true);
        const saved = await fsA.readText(wsPath("a.md"));
        expect(saved.ok && saved.value).toBe("one edited");
        expect(h.workspaceStore.getState().root).toBe(B);
        expect(h.notesStore.getState().openNotes).toEqual([]);
        expect(h.notesStore.getState().notes.map((n) => n.name)).toEqual(["b"]);
        expect(h.persisted().lastWorkspace).toBe(B);
    });

    it("does not switch workspace when pending text cannot be saved", async () => {
        const fsA = seedFs({ "a.md": "one" });
        const h = createHarness({
            workspaces: { [A]: fsA, [B]: seedFs({ "b.md": "" }) },
            picked: A,
        });
        await h.workspaceActions.openWorkspace();
        await h.notesActions.openNote(wsPath("a.md"));
        h.notesActions.updateText(wsPath("a.md"), "edited");
        fsA.failNextWrite();
        h.pick(B);
        const result = await h.workspaceActions.openWorkspace();
        expect(result.ok).toBe(false);
        expect(h.workspaceStore.getState()).toMatchObject({
            root: A,
            status: "open",
        });
        const session = h.notesStore.getState().openNotes[0];
        expect(session?.text).toBe("edited");
        expect(session?.error?.code).toBe("unknown");
    });
});

describe("switching workspaces", () => {
    it("keeps the current workspace open while the next one is opening", async () => {
        const h = createHarness({
            workspaces: { [A]: seedFs({ "a.md": "1" }), [B]: seedFs({}) },
            picked: A,
        });
        await h.workspaceActions.openWorkspace();
        const statuses: string[] = [];
        h.workspaceStore.subscribe((state) => statuses.push(state.status));

        h.pick(B);
        await h.workspaceActions.openWorkspace();

        expect(statuses.every((status) => status === "open")).toBe(true);
        expect(h.workspaceStore.getState().root).toBe(B);
    });

    it("keeps the old workspace and its unsaved text when Discard is chosen but the new folder cannot be opened", async () => {
        const fs = seedFs({ "a.md": "base" });
        const h = createHarness({ workspaces: { [A]: fs }, picked: A });
        await h.workspaceActions.openWorkspace();
        await h.notesActions.openNote(wsPath("a.md"));
        h.notesActions.updateText(wsPath("a.md"), "mine");
        fs.failNextWrite();
        h.pick(B);
        await h.workspaceActions.openWorkspace();

        await h.workspaceActions.continueOpen({ discard: true });

        expect(h.workspaceStore.getState()).toMatchObject({
            status: "open",
            root: A,
            error: { code: "not-found" },
        });
        expect(h.notesStore.getState().openNotes[0]?.text).toBe("mine");
        expect(h.persisted().lastWorkspace).toBe(A);
    });
});

describe("restoreWorkspace", () => {
    it("reopens the last workspace with its tabs and active note", async () => {
        const h = createHarness({
            workspaces: {
                [A]: seedFs({ "a.md": "A text", "b.md": "B text" }),
            },
            settings: {
                ...defaultAppSettings(),
                lastWorkspace: A,
                workspaces: {
                    [A]: {
                        openNotes: [wsPath("a.md"), wsPath("b.md")],
                        activeNote: wsPath("b.md"),
                    },
                },
            },
        });
        await h.workspaceActions.restoreWorkspace();
        expect(h.workspaceStore.getState()).toMatchObject({
            root: A,
            status: "open",
        });
        const notes = h.notesStore.getState();
        expect(notes.openNotes.map((n) => [n.path, n.text])).toEqual([
            ["a.md", "A text"],
            ["b.md", "B text"],
        ]);
        expect(notes.activeNote).toBe("b.md");
    });

    it("does nothing without a last workspace", async () => {
        const h = createHarness();
        await h.workspaceActions.restoreWorkspace();
        expect(h.workspaceStore.getState().status).toBe("welcome");
        expect(h.workspaceStore.getState().notice).toBeNull();
    });

    it("returns to welcome with a notice when the last workspace is missing and keeps lastWorkspace", async () => {
        const h = createHarness({
            settings: { ...defaultAppSettings(), lastWorkspace: A },
        });
        await h.workspaceActions.restoreWorkspace();
        expect(h.workspaceStore.getState()).toMatchObject({
            root: null,
            status: "welcome",
            notice: "workspace-missing",
        });
        expect(h.persisted().lastWorkspace).toBe(A);
    });

    it("uses the unavailable notice when access is denied (scope lost)", async () => {
        const h = createHarness({
            settings: { ...defaultAppSettings(), lastWorkspace: A },
            accessError: "permission-denied",
        });
        await h.workspaceActions.restoreWorkspace();
        expect(h.workspaceStore.getState()).toMatchObject({
            status: "welcome",
            notice: "workspace-unavailable",
        });
        expect(h.persisted().lastWorkspace).toBe(A);
    });

    it("clears the notice after a workspace is opened", async () => {
        const h = createHarness({
            workspaces: { [B]: seedFs({}) },
            settings: { ...defaultAppSettings(), lastWorkspace: A },
            picked: B,
        });
        await h.workspaceActions.restoreWorkspace();
        expect(h.workspaceStore.getState().notice).toBe("workspace-missing");
        await h.workspaceActions.openWorkspace();
        expect(h.workspaceStore.getState().notice).toBeNull();
        expect(h.persisted().lastWorkspace).toBe(B);
    });
});
