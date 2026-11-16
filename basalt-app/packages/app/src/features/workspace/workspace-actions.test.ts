import { describe, expect, it, vi } from "vitest";
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

    it("uses the access-needed notice when the scope denies the root and keeps lastWorkspace", async () => {
        const h = createHarness({
            settings: { ...defaultAppSettings(), lastWorkspace: A },
            accessError: "scope-denied",
        });
        await h.workspaceActions.restoreWorkspace();
        expect(h.workspaceStore.getState()).toMatchObject({
            root: null,
            status: "welcome",
            notice: "workspace-access-needed",
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
    describe("access needed", () => {
        const denied = () =>
            Promise.resolve(
                err({ code: "scope-denied", message: "forbidden" }),
            );

        async function openWith(fs = seedFs({ "n.md": "" })) {
            const h = createHarness({ workspaces: { [A]: fs }, picked: A });
            await h.workspaceActions.openWorkspace();
            return { h, fs };
        }

        it("starts without the flag", async () => {
            const { h } = await openWith();
            expect(h.workspaceStore.getState().accessNeeded).toBe(false);
        });

        it("sets the flag when the workspace file system returns scope-denied", async () => {
            const { h, fs } = await openWith();
            fs.list = denied;
            const refreshed = await h.notesActions.refreshNotes();
            expect(refreshed.ok).toBe(false);
            expect(h.workspaceStore.getState().accessNeeded).toBe(true);
        });

        it("does not set the flag for other errors", async () => {
            const { h, fs } = await openWith();
            fs.list = () =>
                Promise.resolve(err({ code: "unknown", message: "boom" }));
            await h.notesActions.refreshNotes();
            expect(h.workspaceStore.getState().accessNeeded).toBe(false);
        });

        it("keeps unavailable independent of accessNeeded", async () => {
            const { h, fs } = await openWith();
            fs.list = denied;
            await h.notesActions.refreshNotes();
            expect(h.workspaceStore.getState()).toMatchObject({
                accessNeeded: true,
                unavailable: false,
            });
        });

        it("resets the flag when leaving the workspace", async () => {
            const { h, fs } = await openWith();
            fs.list = denied;
            await h.notesActions.refreshNotes();
            await h.workspaceActions.leaveWorkspace();
            expect(h.workspaceStore.getState().accessNeeded).toBe(false);
        });

        it("resets the flag when entering another workspace", async () => {
            const fsA = seedFs({ "n.md": "" });
            const h = createHarness({
                workspaces: { [A]: fsA, [B]: seedFs({}) },
                picked: A,
            });
            await h.workspaceActions.openWorkspace();
            fsA.list = denied;
            await h.notesActions.refreshNotes();
            h.pick(B);
            await h.workspaceActions.openWorkspace();
            expect(h.workspaceStore.getState().accessNeeded).toBe(false);
        });
    });
});

describe("regrantAccess", () => {
    const denied = () =>
        Promise.resolve(err({ code: "scope-denied", message: "forbidden" }));

    async function openDenied(options: { pickError?: boolean } = {}) {
        const fs = seedFs({ "a.md": "", "b.md": "" });
        const h = createHarness({
            workspaces: { [A]: fs, [B]: seedFs({ "z.md": "" }) },
            settings: { ...defaultAppSettings(), lastWorkspace: A },
            pickError: options.pickError,
        });
        await h.workspaceActions.restoreWorkspace();
        await h.notesActions.openNote(wsPath("a.md"));
        h.notesActions.updateText(wsPath("a.md"), "typed");
        const list = fs.list.bind(fs);
        fs.list = denied;
        await h.notesActions.refreshNotes();
        expect(h.workspaceStore.getState().accessNeeded).toBe(true);
        return { h, fs, grant: () => (fs.list = list) };
    }

    it("offers the current root as the default path", async () => {
        const { h } = await openDenied();
        h.pick(null);
        await h.workspaceActions.regrantAccess();
        expect(h.pickCalls.at(-1)).toEqual({ defaultPath: A });
    });

    it("clears the flag and refreshes notes for the same folder keeping tabs and unsaved text", async () => {
        const { h, fs, grant } = await openDenied();
        grant();
        fs.externalWrite(wsPath("c.md"), new Uint8Array());
        h.pick(root(`${A}/`));
        const result = await h.workspaceActions.regrantAccess();
        expect(result.ok).toBe(true);
        expect(h.workspaceStore.getState()).toMatchObject({
            accessNeeded: false,
            root: A,
            status: "open",
        });
        const notes = h.notesStore.getState();
        expect(notes.notes.map((n) => n.name)).toContain("c");
        expect(notes.activeNote).toBe("a.md");
        expect(notes.openNotes.map((n) => [n.path, n.text])).toEqual([
            ["a.md", "typed"],
        ]);
    });

    it("reloads images for the same folder", async () => {
        const { h, grant } = await openDenied();
        grant();
        const notify = vi.spyOn(h.images, "notifyFocus");
        h.pick(A);
        await h.workspaceActions.regrantAccess();
        expect(notify).toHaveBeenCalledTimes(1);
    });

    it("keeps the flag when the folder is still denied after the pick", async () => {
        const { h } = await openDenied();
        h.pick(A);
        await h.workspaceActions.regrantAccess();
        expect(h.workspaceStore.getState().accessNeeded).toBe(true);
    });

    it("switches through the open flow when a different folder is picked", async () => {
        const { h } = await openDenied();
        h.notesActions.updateText(wsPath("a.md"), "");
        h.pick(B);
        const result = await h.workspaceActions.regrantAccess();
        expect(result.ok).toBe(true);
        expect(h.workspaceStore.getState()).toMatchObject({
            root: B,
            accessNeeded: false,
        });
        expect(h.notesStore.getState().notes.map((n) => n.name)).toEqual(["z"]);
    });

    it("changes nothing when the picker is cancelled", async () => {
        const { h } = await openDenied();
        h.pick(null);
        const before = h.workspaceStore.getState();
        const result = await h.workspaceActions.regrantAccess();
        expect(result.ok).toBe(true);
        expect(h.workspaceStore.getState()).toEqual(before);
    });

    it("stores the error and keeps the flag when the picker fails", async () => {
        const { h } = await openDenied({ pickError: true });
        const result = await h.workspaceActions.regrantAccess();
        expect(result.ok).toBe(false);
        expect(h.workspaceStore.getState()).toMatchObject({
            accessNeeded: true,
            error: { code: "unknown" },
            root: A,
        });
    });

    it("does nothing when no workspace is open", async () => {
        const h = createHarness({ picked: A });
        const result = await h.workspaceActions.regrantAccess();
        expect(result.ok).toBe(true);
        expect(h.pickCalls).toEqual([]);
    });
});
