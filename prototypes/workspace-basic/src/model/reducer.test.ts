import { describe, expect, it } from "vitest";
import { applyPreset } from "./presets";
import { SCREEN_IDS } from "./types";
import type { AppState } from "./types";
import { initialState, reduce } from "./reducer";
import type { Action } from "./reducer";

const run = (state: AppState, ...actions: Action[]) =>
    actions.reduce(
        (current, action) => reduce(current, action, applyPreset),
        state,
    );

const opened = () => run(initialState(), { type: "pick-workspace" });

const withNote = (path = "Weekly plan.md") =>
    run(opened(), { type: "open-note", path });

const typed = (state: AppState, suffix = " Edited.") => {
    const tab = state.tabs[0];
    return run(state, {
        type: "edit",
        path: tab.path,
        text: tab.text + suffix,
    });
};

const settle = (state: AppState, path: string) =>
    run(state, { type: "save-start", path }, { type: "save-finish", path });

describe("screen derivation", () => {
    it("follows the happy path from the welcome screen to the editor", () => {
        const start = initialState();
        expect(start.screen).toBe("s01");
        const list = run(start, { type: "pick-workspace" });
        expect(list.screen).toBe("s02");
        expect(run(list, { type: "open-note", path: "Ideas.md" }).screen).toBe(
            "s03",
        );
    });

    it("shows the screen of the open dialog", () => {
        const base = withNote();
        const dialog = (kind: "rename" | "delete") =>
            run(base, {
                type: "open-dialog",
                dialog:
                    kind === "rename"
                        ? { kind, path: "Weekly plan.md", name: "Weekly plan" }
                        : { kind, paths: ["Weekly plan.md"] },
            }).screen;
        expect(dialog("rename")).toBe("s11");
        expect(dialog("delete")).toBe("s13");
    });

    it("reaches every screen id from the screen map with a preset", () => {
        for (const id of SCREEN_IDS) {
            const state = run(initialState(), {
                type: "enter-screen",
                screen: id,
            });
            expect(state.screen).toBe(id);
            expect(state.workspace === null).toBe(id === "s01");
        }
    });
});

describe("autosave", () => {
    it("moves from pending to saving to saved and writes the file", () => {
        const base = typed(withNote());
        const path = base.tabs[0].path;
        expect(base.tabs[0].save).toBe("pending");
        const saving = run(base, { type: "save-start", path });
        expect(saving.tabs[0].save).toBe("saving");
        const saved = run(saving, { type: "save-finish", path });
        expect(saved.tabs[0].save).toBe("saved");
        const file = saved.workspace?.files[path];
        expect(file?.kind === "note" && file.text).toContain("Edited.");
    });

    it("keeps the text and pauses when the next save fails", () => {
        const failing = run(typed(withNote()), {
            type: "set-scenario",
            patch: { nextSave: "denied" },
        });
        const failed = settle(failing, failing.tabs[0].path);
        expect(failed.tabs[0]).toMatchObject({
            save: "paused",
            banner: "permission-denied",
        });
        expect(failed.tabs[0].text).toContain("Edited.");
    });

    it("succeeds on Retry after a save that fails once", () => {
        const base = run(typed(withNote()), {
            type: "set-scenario",
            patch: { nextSave: "fail-once" },
        });
        const path = base.tabs[0].path;
        const failed = settle(base, path);
        const retried = run(
            failed,
            { type: "retry-save", path },
            { type: "save-finish", path },
        );
        expect(retried.tabs[0]).toMatchObject({ save: "saved", banner: null });
    });
});

describe("closing a tab with unsaved text", () => {
    it("saves first and then closes", () => {
        const base = typed(withNote());
        const path = base.tabs[0].path;
        const closing = run(base, { type: "request-close-tab", path });
        expect(closing.tabs).toHaveLength(1);
        const done = run(closing, { type: "save-finish", path });
        expect(done.tabs).toHaveLength(0);
        expect(done.workspace?.files[path]).toMatchObject({ kind: "note" });
    });

    it("opens the Save-failed dialog when saving fails and keeps the tab on Cancel", () => {
        const base = run(typed(withNote()), {
            type: "set-scenario",
            patch: { nextSave: "denied" },
        });
        const path = base.tabs[0].path;
        const closing = run(
            base,
            { type: "request-close-tab", path },
            { type: "save-finish", path },
        );
        expect(closing.dialog?.kind).toBe("save-failed");
        expect(closing.screen).toBe("s05");
        const cancelled = run(closing, { type: "close-dialog" });
        expect(cancelled.tabs).toHaveLength(1);
        expect(cancelled.tabs[0].text).toContain("Edited.");
    });

    it("shows Retry failed when Retry fails again and never discards on its own", () => {
        const base = run(typed(withNote()), {
            type: "set-scenario",
            patch: { nextSave: "denied" },
        });
        const path = base.tabs[0].path;
        const failedOnce = run(
            base,
            { type: "request-close-tab", path },
            { type: "save-finish", path },
        );
        const failedTwice = run(
            failedOnce,
            { type: "save-failed-retry" },
            { type: "save-finish", path },
        );
        expect(failedTwice.dialog).toMatchObject({
            kind: "save-failed",
            retryFailed: true,
        });
        expect(failedTwice.tabs[0].text).toContain("Edited.");
    });

    it("discards the edits and closes on Discard changes", () => {
        const base = run(typed(withNote()), {
            type: "set-scenario",
            patch: { nextSave: "denied" },
        });
        const path = base.tabs[0].path;
        const dialog = run(
            base,
            { type: "request-close-tab", path },
            { type: "save-finish", path },
        );
        const discarded = run(dialog, { type: "save-failed-discard" });
        expect(discarded.tabs).toHaveLength(0);
        const file = discarded.workspace?.files[path];
        expect(file?.kind === "note" && file.text).not.toContain("Edited.");
    });
});

describe("workspace operations", () => {
    it("creates Untitled at once in the root and opens it, without a dialog", () => {
        const state = run(opened(), { type: "quick-note", folder: "" });
        expect(state.dialog).toBeNull();
        expect(state.workspace?.files["Untitled.md"]).toMatchObject({
            kind: "note",
            text: "",
        });
        expect(state.active).toBe("Untitled.md");
        expect(state.screen).toBe("s04");
    });

    it("names the next quick note Untitled 1 when Untitled is taken", () => {
        const state = run(
            opened(),
            { type: "quick-note", folder: "" },
            { type: "quick-note", folder: "" },
        );
        expect(state.workspace?.files["Untitled 1.md"]).toBeDefined();
        expect(state.active).toBe("Untitled 1.md");
        expect(state.tabs).toHaveLength(2);
    });

    it("creates the quick note inside the chosen folder and expands it", () => {
        const state = run(opened(), { type: "quick-note", folder: "journal" });
        expect(state.workspace?.files["journal/Untitled.md"]).toBeDefined();
        expect(state.workspace?.files["Untitled.md"]).toBeUndefined();
        expect(state.expanded).toContain("journal");
        expect(state.active).toBe("journal/Untitled.md");
    });

    it("shows the read-only message and adds no entry for a quick note", () => {
        const picked = run(
            initialState({ ...initialState().scenario, picker: "W3" }),
            { type: "pick-workspace" },
        );
        const state = run(picked, { type: "quick-note", folder: "" });
        expect(state.sidebarNotice).toContain(
            "The workspace folder is read-only. Nothing was changed.",
        );
        expect(state.workspace?.files["Untitled.md"]).toBeUndefined();
        expect(state.tabs).toHaveLength(0);
    });

    it("renames the file and keeps the note open", () => {
        const state = run(
            withNote("Ideas.md"),
            {
                type: "open-dialog",
                dialog: { kind: "rename", path: "Ideas.md", name: "Ideas" },
            },
            { type: "dialog-name", name: "Better ideas" },
            { type: "submit-dialog" },
            { type: "complete-submit" },
        );
        expect(state.workspace?.files["Better ideas.md"]).toBeDefined();
        expect(state.workspace?.files["Ideas.md"]).toBeUndefined();
        expect(state.active).toBe("Better ideas.md");
        expect(state.tabs.map((tab) => tab.path)).toEqual(["Better ideas.md"]);
    });

    it("allows a case-only rename of the note's own name", () => {
        const state = run(
            withNote("Weekly plan.md"),
            {
                type: "open-dialog",
                dialog: {
                    kind: "rename",
                    path: "Weekly plan.md",
                    name: "Weekly plan",
                },
            },
            { type: "dialog-name", name: "weekly plan" },
        );
        expect(state.dialog).toMatchObject({ error: undefined });
    });

    it("moves a note to a folder and every open tab follows", () => {
        const state = run(withNote("Ideas.md"), {
            type: "move",
            paths: ["Ideas.md"],
            to: "projects",
        });
        expect(state.workspace?.files["projects/Ideas.md"]).toBeDefined();
        expect(state.active).toBe("projects/Ideas.md");
        expect(state.expanded).toContain("projects");
    });

    it("refuses to move onto a name that already exists and changes nothing", () => {
        const withClash = run(
            opened(),
            {
                type: "open-dialog",
                dialog: {
                    kind: "rename",
                    path: "journal/Daily 2026-10-18.md",
                    name: "Daily 2026-10-18",
                },
            },
            { type: "dialog-name", name: "Ideas" },
            { type: "submit-dialog" },
            { type: "complete-submit" },
        );
        const before = withClash.workspace?.files;
        const refused = run(withClash, {
            type: "move",
            paths: ["Ideas.md"],
            to: "journal",
        });
        expect(refused.workspace?.files).toEqual(before);
        expect(refused.sidebarNotice).toMatch(/already exists/);
    });

    it("does nothing when a note is dropped on its own folder", () => {
        const state = run(opened(), {
            type: "move",
            paths: ["journal/Daily 2026-10-18.md"],
            to: "journal",
        });
        expect(
            state.workspace?.files["journal/Daily 2026-10-18.md"],
        ).toBeDefined();
        expect(state.sidebarNotice).toBeNull();
    });

    it("deletes a note, closes its tab and offers no undo", () => {
        const base = run(withNote("Ideas.md"), {
            type: "open-dialog",
            dialog: { kind: "delete", paths: ["Ideas.md"] },
        });
        const deleted = run(base, { type: "submit-dialog" });
        expect(deleted.workspace?.files["Ideas.md"]).toBeUndefined();
        expect(deleted.tabs).toHaveLength(0);
        expect(deleted.screen).toBe("s02");
        expect(deleted.toast?.title).toBe('"Ideas" moved to trash');
        expect(deleted.toast).not.toHaveProperty("undo");
    });

    it("changes nothing on disk when the workspace is read-only", () => {
        const picked = run(
            initialState({ ...initialState().scenario, picker: "W3" }),
            { type: "pick-workspace" },
        );
        const state = run(
            picked,
            { type: "open-note", path: "Old plan.md" },
            {
                type: "open-dialog",
                dialog: { kind: "delete", paths: ["Old plan.md"] },
            },
            { type: "submit-dialog" },
        );
        expect(state.workspace?.files["Old plan.md"]).toBeDefined();
        expect(state.sidebarNotice).toMatch(/read-only/);
    });
});

describe("several notes at once", () => {
    const visible = [
        "Ideas.md",
        "Meeting notes.md",
        "Reading list.md",
        "Shopping.md",
    ];

    it("selects with toggle and range and starts from the open note", () => {
        const toggled = run(
            withNote("Ideas.md"),
            { type: "select", path: "Shopping.md", mode: "toggle", visible },
            {
                type: "select",
                path: "Reading list.md",
                mode: "toggle",
                visible,
            },
        );
        expect(toggled.selection).toEqual([
            "Ideas.md",
            "Shopping.md",
            "Reading list.md",
        ]);
        const ranged = run(
            opened(),
            { type: "select", path: "Meeting notes.md", mode: "set", visible },
            { type: "select", path: "Shopping.md", mode: "range", visible },
        );
        expect(ranged.selection).toEqual([
            "Meeting notes.md",
            "Reading list.md",
            "Shopping.md",
        ]);
    });

    it("deselects a note that is toggled again and clears the selection on a plain open", () => {
        const state = run(
            opened(),
            { type: "select", path: "Ideas.md", mode: "set", visible },
            { type: "select", path: "Shopping.md", mode: "toggle", visible },
            { type: "select", path: "Ideas.md", mode: "toggle", visible },
        );
        expect(state.selection).toEqual(["Shopping.md"]);
        const opened2 = run(state, { type: "open-note", path: "Ideas.md" });
        expect(opened2.selection).toEqual([]);
    });

    it("deletes all selected notes with one confirmation and closes their tabs", () => {
        const base = run(
            withNote("Ideas.md"),
            { type: "open-note", path: "Shopping.md" },
            {
                type: "open-dialog",
                dialog: {
                    kind: "delete",
                    paths: ["Ideas.md", "Shopping.md"],
                },
            },
        );
        const deleted = run(base, { type: "submit-dialog" });
        expect(deleted.workspace?.files["Ideas.md"]).toBeUndefined();
        expect(deleted.workspace?.files["Shopping.md"]).toBeUndefined();
        expect(deleted.workspace?.files["Meeting notes.md"]).toBeDefined();
        expect(deleted.tabs).toHaveLength(0);
        expect(deleted.toast?.title).toBe("2 notes moved to trash");
        expect(deleted.selection).toEqual([]);
    });

    it("deletes nothing from a read-only workspace", () => {
        const picked = run(
            initialState({ ...initialState().scenario, picker: "W3" }),
            { type: "pick-workspace" },
        );
        const paths = Object.keys(picked.workspace?.files ?? {}).filter(
            (path) => picked.workspace?.files[path].kind === "note",
        );
        const state = run(
            picked,
            { type: "open-dialog", dialog: { kind: "delete", paths } },
            { type: "submit-dialog" },
        );
        expect(Object.keys(state.workspace?.files ?? {})).toEqual(
            Object.keys(picked.workspace?.files ?? {}),
        );
        expect(state.sidebarNotice).toMatch(/notes.*read-only/);
    });

    it("moves all selected notes and every open tab follows", () => {
        const state = run(
            run(withNote("Ideas.md"), {
                type: "open-note",
                path: "Shopping.md",
            }),
            {
                type: "select",
                path: "Ideas.md",
                mode: "set",
                visible,
            },
            {
                type: "move",
                paths: ["Ideas.md", "Shopping.md"],
                to: "projects",
            },
        );
        expect(state.workspace?.files["projects/Ideas.md"]).toBeDefined();
        expect(state.workspace?.files["projects/Shopping.md"]).toBeDefined();
        expect(state.workspace?.files["Ideas.md"]).toBeUndefined();
        expect(state.tabs.map((tab) => tab.path).sort()).toEqual([
            "projects/Ideas.md",
            "projects/Shopping.md",
        ]);
        expect(state.selection).toEqual([]);
        expect(state.sidebarNotice).toBeNull();
        expect(state.expanded).toContain("projects");
    });

    it("moves nothing when any selected note collides at the destination", () => {
        const withClash = run(opened(), {
            type: "open-dialog",
            dialog: {
                kind: "rename",
                path: "journal/Daily 2026-10-18.md",
                name: "Daily 2026-10-18",
            },
        });
        const clashing = run(
            withClash,
            { type: "dialog-name", name: "Shopping" },
            { type: "submit-dialog" },
            { type: "complete-submit" },
        );
        const before = clashing.workspace?.files;
        const refused = run(clashing, {
            type: "move",
            paths: ["Ideas.md", "Shopping.md"],
            to: "journal",
        });
        expect(refused.workspace?.files).toEqual(before);
        expect(refused.sidebarNotice).toBe(
            'A note named "Shopping" already exists in that folder. Nothing was moved.',
        );
    });

    it("skips notes already in the destination and moves the rest", () => {
        const state = run(opened(), {
            type: "move",
            paths: ["journal/Daily 2026-10-18.md", "Ideas.md"],
            to: "journal",
        });
        expect(state.workspace?.files["journal/Ideas.md"]).toBeDefined();
        expect(
            state.workspace?.files["journal/Daily 2026-10-18.md"],
        ).toBeDefined();
    });

    it("moves nothing from a read-only workspace", () => {
        const picked = run(
            initialState({ ...initialState().scenario, picker: "W3" }),
            { type: "pick-workspace" },
        );
        const paths = Object.keys(picked.workspace?.files ?? {}).filter(
            (path) => picked.workspace?.files[path].kind === "note",
        );
        const state = run(picked, { type: "move", paths, to: "" });
        expect(state.workspace?.files).toEqual(picked.workspace?.files);
    });
});

describe("pasting images", () => {
    it("copies the image into attachments and inserts a relative link after the cursor line", () => {
        const base = run(
            withNote("projects/Roadmap.md"),
            { type: "set-cursor", path: "projects/Roadmap.md", line: 0 },
            { type: "set-scenario", patch: { drop: "two" } },
            { type: "drop" },
        );
        const names = Object.keys(base.workspace?.files ?? {}).filter((path) =>
            path.startsWith("attachments/Pasted"),
        );
        expect(names).toEqual([
            "attachments/Pasted image 20261025143012.png",
            "attachments/Pasted image 20261025143012 1.png",
        ]);
        const lines = base.tabs[0].text.split("\n");
        expect(lines[1]).toBe(
            "![Pasted image 20261025143012](../attachments/Pasted%20image%2020261025143012.png)",
        );
        expect(lines[2]).toContain("Pasted%20image%2020261025143012%201.png");
        expect(base.tabs[0].save).toBe("pending");
        expect(base.screen).toBe("s08");
    });

    it("does nothing without an open note", () => {
        const base = opened();
        const result = run(base, { type: "paste" });
        expect(result.workspace).toEqual(base.workspace);
        expect(result.simResult).toMatch(/No note is open/);
    });
});

describe("opening a workspace", () => {
    it("keeps the welcome screen and reports a cancelled picker", () => {
        const state = run(
            initialState({ ...initialState().scenario, picker: "cancel" }),
            { type: "pick-workspace" },
        );
        expect(state.workspace).toBeNull();
        expect(state.status).toBe("No folder was chosen. Nothing changed.");
    });

    it("shows a notice when the folder cannot be opened", () => {
        const state = run(
            initialState({ ...initialState().scenario, picker: "unopenable" }),
            { type: "pick-workspace" },
        );
        expect(state.workspace).toBeNull();
        expect(state.notice).toMatch(/could not open/);
    });
});
