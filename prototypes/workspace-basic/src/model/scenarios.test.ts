import { describe, expect, it } from "vitest";
import { resolveImage } from "./markdown";
import { applyPreset } from "./presets";
import {
    bootState,
    defaultScenario,
    isDirty,
    listedFiles,
    reduce,
} from "./reducer";
import type { Action } from "./reducer";
import type { AppState, Scenario } from "./types";

const run = (state: AppState, ...actions: Action[]) =>
    actions.reduce(
        (current, action) => reduce(current, action, applyPreset),
        state,
    );

const boot = (patch: Partial<Scenario> = {}) =>
    bootState({ ...defaultScenario, ...patch });

const withNote = (path = "Weekly plan.md", patch: Partial<Scenario> = {}) =>
    run(boot(patch), { type: "pick-workspace" }, { type: "open-note", path });

const dirty = (state: AppState) =>
    run(state, {
        type: "edit",
        path: state.tabs[0].path,
        text: `${state.tabs[0].text} Mine.`,
    });

describe("launch (sw01)", () => {
    it("restores the last workspace with two tabs and the last note active", () => {
        const state = boot({ launch: "restore" });
        expect(state.workspace?.name).toBe("Basalt notes");
        expect(state.tabs.map((tab) => tab.path)).toEqual([
            "Meeting notes.md",
            "Weekly plan.md",
        ]);
        expect(state.active).toBe("Weekly plan.md");
    });

    it("shows the welcome screen with a notice when the last workspace is missing", () => {
        const state = boot({ launch: "missing" });
        expect(state.workspace).toBeNull();
        expect(state.notice).toMatch(/no longer exists/);
    });

    it("shows a restoring state first when the restore is slow", () => {
        const slow = boot({ launch: "slow" });
        expect(slow.restoring).toBe(true);
        expect(slow.workspace).toBeNull();
        const done = run(slow, { type: "restore-done" });
        expect(done.restoring).toBe(false);
        expect(done.tabs).toHaveLength(2);
    });

    it("applies a changed launch value at once", () => {
        const state = run(boot(), {
            type: "set-scenario",
            patch: { launch: "restore" },
        });
        expect(state.workspace).not.toBeNull();
    });
});

describe("note list (sw03, sw04)", () => {
    it("loads slowly, then becomes ready", () => {
        const loading = run(boot({ listing: "slow" }), {
            type: "pick-workspace",
        });
        expect(loading.listStatus).toBe("loading");
        expect(run(loading, { type: "list-loaded" }).listStatus).toBe("ready");
    });

    it("stays in the error state when the read fails again", () => {
        const failed = run(boot({ listing: "error" }), {
            type: "pick-workspace",
        });
        expect(failed.listStatus).toBe("error");
        expect(run(failed, { type: "reload-list" }).listStatus).toBe("error");
        const fixed = run(failed, {
            type: "set-scenario",
            patch: { listing: "instant" },
        });
        expect(fixed.listStatus).toBe("ready");
    });

    it("shows a note added on disk at once when the watcher is live", () => {
        const state = run(
            boot(),
            { type: "pick-workspace" },
            { type: "external", kind: "add" },
        );
        expect(Object.keys(listedFiles(state))).toContain("Added on disk 1.md");
    });

    it("shows a note added on disk only after the window is focused in fallback mode", () => {
        const state = run(
            boot({ watcher: "unavailable" }),
            { type: "pick-workspace" },
            { type: "external", kind: "add" },
        );
        expect(Object.keys(listedFiles(state))).not.toContain(
            "Added on disk 1.md",
        );
        const focused = run(state, { type: "window-focus" });
        expect(Object.keys(listedFiles(focused))).toContain(
            "Added on disk 1.md",
        );
    });

    it("removes a note that is not open and keeps the open one", () => {
        const before = withNote("Ideas.md");
        const count = (state: AppState) =>
            Object.values(state.workspace?.files ?? {}).filter(
                (entry) => entry.kind === "note",
            ).length;
        const state = run(before, { type: "external", kind: "remove" });
        expect(count(state)).toBe(count(before) - 1);
        expect(state.workspace?.files["Ideas.md"]).toBeDefined();
    });
});

describe("external changes to the open note (sw08)", () => {
    it("reloads a clean note silently", () => {
        const state = run(withNote(), { type: "external", kind: "edit" });
        expect(state.tabs[0].text).toMatch(/Edited in another program/);
        expect(state.tabs[0].banner).toBeNull();
        expect(isDirty(state.tabs[0])).toBe(false);
    });

    it("pauses autosave and shows the conflict banner when the note is dirty", () => {
        const state = run(dirty(withNote()), {
            type: "external",
            kind: "edit",
        });
        expect(state.tabs[0]).toMatchObject({
            banner: "conflict",
            save: "paused",
        });
        expect(state.tabs[0].text).toContain("Mine.");
    });

    it("keeps my version and saves it", () => {
        const conflict = run(dirty(withNote()), {
            type: "external",
            kind: "edit",
        });
        const kept = run(conflict, {
            type: "keep-mine",
            path: conflict.tabs[0].path,
        });
        expect(kept.tabs[0]).toMatchObject({ banner: null, save: "pending" });
    });

    it("loads the disk version only after confirmation", () => {
        const conflict = run(dirty(withNote()), {
            type: "external",
            kind: "edit",
        });
        const asking = run(conflict, {
            type: "open-dialog",
            dialog: {
                kind: "discard-edits",
                path: conflict.tabs[0].path,
                action: "load-from-disk",
            },
        });
        expect(asking.screen).toBe("s06");
        expect(asking.tabs[0].text).toContain("Mine.");
        const loaded = run(asking, { type: "confirm-discard" });
        expect(loaded.tabs[0].text).not.toContain("Mine.");
        expect(loaded.tabs[0].text).toMatch(/Edited in another program/);
        expect(loaded.tabs[0].banner).toBeNull();
    });

    it("shows the deleted banner and pauses autosave for a note deleted on disk", () => {
        const state = run(withNote(), { type: "external", kind: "delete" });
        expect(state.tabs[0]).toMatchObject({
            banner: "deleted",
            save: "paused",
        });
        expect(state.workspace?.files["Weekly plan.md"]).toBeUndefined();
    });

    it("treats a move on disk like a delete of the open path", () => {
        const state = run(withNote(), { type: "external", kind: "move" });
        expect(state.tabs[0].banner).toBe("deleted");
        expect(state.workspace?.files["Weekly plan (moved).md"]).toBeDefined();
    });

    it("saves the note again at its path", () => {
        const deleted = run(withNote(), { type: "external", kind: "delete" });
        const path = deleted.tabs[0].path;
        const saved = run(
            deleted,
            { type: "save-again", path },
            { type: "save-finish", path },
        );
        expect(saved.workspace?.files[path]).toMatchObject({ kind: "note" });
        expect(saved.tabs[0].banner).toBeNull();
    });

    it("closes a clean deleted note at once and asks before closing a dirty one", () => {
        const clean = run(
            run(withNote(), { type: "external", kind: "delete" }),
            {
                type: "close-deleted",
                path: "Weekly plan.md",
            },
        );
        expect(clean.tabs).toHaveLength(0);
        const base = run(dirty(withNote()), {
            type: "external",
            kind: "delete",
        });
        const asking = run(base, {
            type: "close-deleted",
            path: base.tabs[0].path,
        });
        expect(asking.dialog).toMatchObject({
            kind: "discard-edits",
            action: "close",
        });
        expect(asking.tabs).toHaveLength(1);
        expect(run(asking, { type: "confirm-discard" }).tabs).toHaveLength(0);
    });

    it("tells the reviewer when no note is open", () => {
        const state = run(
            boot(),
            { type: "pick-workspace" },
            { type: "external", kind: "edit" },
        );
        expect(state.simResult).toMatch(/No note is open/);
    });
});

describe("workspace folder lost (sw05)", () => {
    it("returns to the welcome screen with a notice when nothing is unsaved", () => {
        const state = run(withNote(), {
            type: "set-scenario",
            patch: { folder: "lost" },
        });
        expect(state.workspace).toBeNull();
        expect(state.notice).toMatch(/deleted or renamed/);
        expect(state.screen).toBe("s01");
    });

    it("runs the Save-failed dialog first and keeps the text when unsaved text exists", () => {
        const state = run(dirty(withNote()), {
            type: "set-scenario",
            patch: { folder: "lost" },
        });
        expect(state.dialog).toMatchObject({
            kind: "save-failed",
            reason: "The workspace folder no longer exists.",
        });
        expect(state.workspace).not.toBeNull();
        const cancelled = run(state, { type: "close-dialog" });
        expect(cancelled.tabs[0]).toMatchObject({
            banner: "workspace-lost",
            save: "paused",
        });
        expect(cancelled.tabs[0].text).toContain("Mine.");
    });

    it("saves after the folder is back and Retry is chosen", () => {
        const lost = run(
            run(dirty(withNote()), {
                type: "set-scenario",
                patch: { folder: "lost" },
            }),
            { type: "close-dialog" },
        );
        const path = lost.tabs[0].path;
        const back = run(
            lost,
            { type: "set-scenario", patch: { folder: "present" } },
            { type: "retry-save", path },
            { type: "save-finish", path },
        );
        expect(back.tabs[0]).toMatchObject({ save: "saved", banner: null });
    });

    it("discards the text and goes to the welcome screen on Discard changes", () => {
        const dialog = run(dirty(withNote()), {
            type: "set-scenario",
            patch: { folder: "lost" },
        });
        const done = run(dialog, { type: "save-failed-discard" });
        expect(done.workspace).toBeNull();
        expect(done.notice).toMatch(/deleted or renamed/);
    });
});

describe("dialogs with a pending state", () => {
    it("shows creating first and creates the folder on completion", () => {
        const pending = run(
            run(boot(), { type: "pick-workspace" }),
            {
                type: "open-dialog",
                dialog: { kind: "new-folder", parent: "", name: "Plan C" },
            },
            { type: "submit-dialog" },
        );
        expect(pending.dialog).toMatchObject({ pending: true });
        expect(pending.workspace?.files["Plan C"]).toBeUndefined();
        const done = run(pending, { type: "complete-submit" });
        expect(done.workspace?.files["Plan C"]).toMatchObject({
            kind: "folder",
        });
    });

    it("fails in a read-only workspace with an error and no ghost entry", () => {
        const failed = run(
            run(boot({ picker: "W3" }), { type: "pick-workspace" }),
            {
                type: "open-dialog",
                dialog: { kind: "new-folder", parent: "", name: "Plan C" },
            },
            { type: "submit-dialog" },
            { type: "complete-submit" },
        );
        expect(failed.dialog).toMatchObject({ pending: false });
        expect(
            failed.dialog && "error" in failed.dialog && failed.dialog.error,
        ).toMatch(/read-only/);
        expect(failed.workspace?.files["Plan C"]).toBeUndefined();
    });

    it("closes a rename to the same name without changing anything", () => {
        const state = run(
            withNote("Ideas.md"),
            {
                type: "open-dialog",
                dialog: { kind: "rename", path: "Ideas.md", name: "Ideas" },
            },
            { type: "submit-dialog" },
        );
        expect(state.dialog).toBeNull();
        expect(state.workspace?.files["Ideas.md"]).toBeDefined();
    });
});

describe("delete result (sw14)", () => {
    const delDialog = (patch: Partial<Scenario>) =>
        run(
            withNote("Ideas.md", patch),
            {
                type: "open-dialog",
                dialog: { kind: "delete", paths: ["Ideas.md"] },
            },
            { type: "submit-dialog" },
        );

    it("refuses and keeps the note when the OS trash is unavailable", () => {
        const state = delDialog({ deleteResult: "no-trash" });
        expect(state.workspace?.files["Ideas.md"]).toBeDefined();
        expect(state.tabs).toHaveLength(1);
        expect(state.sidebarNotice).toMatch(/no trash/);
        expect(state.toast).toBeNull();
    });

    it("keeps the note when moving it to the trash fails", () => {
        const state = delDialog({ deleteResult: "fails" });
        expect(state.workspace?.files["Ideas.md"]).toBeDefined();
        expect(state.sidebarNotice).toMatch(/Nothing was deleted/);
    });
});

describe("move result (sw15)", () => {
    const moved = (moveResult: Scenario["moveResult"]) =>
        run(withNote("Weekly plan.md", { moveResult }), {
            type: "move",
            paths: ["Weekly plan.md"],
            to: "projects",
        });

    it("leaves image links untouched, so the image is not found", () => {
        const state = moved("ok");
        const tab = state.tabs[0];
        expect(tab.text).toContain("](attachments/Roadmap%20diagram.png)");
        expect(
            resolveImage(
                state.workspace?.files ?? {},
                tab.path,
                "attachments/Roadmap%20diagram.png",
            ),
        ).toMatchObject({ problem: "not-found" });
    });

    it("rewrites image links relative to the new folder", () => {
        const state = moved("links");
        const tab = state.tabs[0];
        expect(tab.text).toContain("](../attachments/Roadmap%20diagram.png)");
        expect(state.sidebarNotice).toMatch(/links were updated/);
        const disk = state.workspace?.files["projects/Weekly plan.md"];
        expect(disk?.kind === "note" && disk.text).toContain("../attachments/");
    });

    it("moves the file but reports that the links could not be updated", () => {
        const state = moved("halfway");
        expect(state.workspace?.files["projects/Weekly plan.md"]).toBeDefined();
        expect(state.tabs[0].text).toContain("](attachments/");
        expect(state.sidebarNotice).toMatch(/could not be updated/);
    });
});

describe("adding images (sw11 to sw13, sw16)", () => {
    const imagesIn = (state: AppState) =>
        Object.keys(state.workspace?.files ?? {}).filter((path) =>
            path.startsWith("attachments/Pasted"),
        );

    it("inserts text instead of an image for a text paste, a text and image paste and a file path", () => {
        for (const clipboard of ["text", "text-image", "path"] as const) {
            const before = withNote("Ideas.md", { clipboard });
            const state = run(before, { type: "paste" });
            expect(imagesIn(state)).toHaveLength(0);
            expect(state.tabs[0].text.length).toBeGreaterThan(
                before.tabs[0].text.length,
            );
            expect(state.tabs[0].text).not.toContain("![");
        }
    });

    it("adds the images that are valid and reports the skipped file", () => {
        const state = run(withNote("Ideas.md", { drop: "two-pdf" }), {
            type: "drop",
        });
        expect(imagesIn(state)).toHaveLength(2);
        expect(state.addNotice).toMatch(/1 file was skipped: Report\.pdf/);
    });

    it("inserts nothing for an unsupported or too large file", () => {
        for (const drop of ["large", "heic"] as const) {
            const state = run(withNote("Ideas.md", { drop }), { type: "drop" });
            expect(imagesIn(state)).toHaveLength(0);
            expect(state.addNotice).toMatch(/No image was added/);
            expect(state.tabs[0].save).toBe("saved");
        }
    });

    it("does nothing visible for a drop outside the editor", () => {
        const base = withNote("Ideas.md", { drop: "outside" });
        const state = run(base, { type: "drop" });
        expect(state.tabs[0].text).toBe(base.tabs[0].text);
        expect(state.addNotice).toBeNull();
        expect(state.simResult).toMatch(/outside the editor/);
    });

    it("inserts nothing and explains why when writing fails or attachments is a file", () => {
        const failed = run(withNote("Ideas.md", { attach: "write-fails" }), {
            type: "paste",
        });
        expect(imagesIn(failed)).toHaveLength(0);
        expect(failed.addNotice).toMatch(/could not be written/);
        const isFile = run(withNote("Ideas.md", { attach: "is-file" }), {
            type: "paste",
        });
        expect(isFile.addNotice).toMatch(/named "attachments"/);
    });

    it("adds no image to a read-only workspace", () => {
        const state = run(
            run(
                boot({ picker: "W3" }),
                { type: "pick-workspace" },
                { type: "open-note", path: "Old plan.md" },
            ),
            { type: "paste" },
        );
        expect(imagesIn(state)).toHaveLength(0);
        expect(state.addNotice).toMatch(/read-only/);
    });

    it("uses a suffix when the same name appears at the last moment", () => {
        const state = run(withNote("Ideas.md", { attach: "race" }), {
            type: "paste",
        });
        expect(imagesIn(state)).toEqual([
            "attachments/Pasted image 20261025143012 1.png",
        ]);
    });

    it("shows an adding state for a large file before the link appears", () => {
        const adding = run(withNote("Ideas.md", { attach: "slow" }), {
            type: "paste",
        });
        expect(adding.adding).toMatchObject({ count: 1 });
        expect(imagesIn(adding)).toHaveLength(0);
        const done = run(adding, { type: "add-complete" });
        expect(done.adding).toBeNull();
        expect(imagesIn(done)).toHaveLength(1);
    });

    it("names the second paste after the clock advances", () => {
        const state = run(
            withNote("Ideas.md"),
            { type: "paste" },
            { type: "advance-clock" },
            { type: "paste" },
        );
        expect(imagesIn(state)).toEqual([
            "attachments/Pasted image 20261025143012.png",
            "attachments/Pasted image 20261025143013.png",
        ]);
    });

    it("replaces the notice on a second add and clears it when another note is selected", () => {
        const first = run(withNote("Ideas.md", { drop: "heic" }), {
            type: "drop",
        });
        const second = run(
            first,
            { type: "set-scenario", patch: { drop: "large" } },
            { type: "drop" },
        );
        expect(second.addNotice).toMatch(/Huge\.png/);
        const other = run(second, { type: "open-note", path: "Shopping.md" });
        expect(other.addNotice).toBeNull();
        expect(
            run(second, { type: "dismiss-add-notice" }).addNotice,
        ).toBeNull();
    });
});

describe("image files (sw10)", () => {
    it("makes a linked image missing and brings it back", () => {
        const path = "attachments/Roadmap diagram.png";
        const missing = run(withNote("Weekly plan.md"), {
            type: "set-image",
            path,
            state: "missing",
        });
        expect(
            resolveImage(
                missing.workspace?.files ?? {},
                "Weekly plan.md",
                "attachments/Roadmap%20diagram.png",
            ),
        ).toMatchObject({ problem: "not-found" });
        const back = run(missing, { type: "set-image", path, state: "ok" });
        expect(
            resolveImage(
                back.workspace?.files ?? {},
                "Weekly plan.md",
                "attachments/Roadmap%20diagram.png",
            ).kind,
        ).toBe("image");
    });
});

describe("note files that cannot be opened (sw09)", () => {
    it("opens the note as the chosen kind without text", () => {
        for (const openAs of [
            "too-large",
            "not-utf8",
            "symlink",
            "unknown",
        ] as const) {
            const state = withNote("Ideas.md", { openAs });
            expect(state.tabs[0]).toMatchObject({ open: openAs, text: "" });
        }
    });

    it("keeps the kind that the demo note has itself", () => {
        const state = withNote("demo/Big note.md");
        expect(state.tabs[0].open).toBe("too-large");
    });
});

describe("open notes (sw18)", () => {
    it("opens one, several or more notes than fit", () => {
        const base = run(boot(), { type: "pick-workspace" });
        expect(
            run(base, { type: "open-notes", mode: "one" }).tabs,
        ).toHaveLength(1);
        expect(
            run(base, { type: "open-notes", mode: "several" }).tabs,
        ).toHaveLength(2);
        expect(
            run(base, { type: "open-notes", mode: "many" }).tabs,
        ).toHaveLength(12);
    });
});

describe("loading a note (sw03)", () => {
    it("shows the opening state and then the note", () => {
        const state = withNote("Ideas.md", { listing: "slow" });
        expect(state.tabs[0].loading).toBe(true);
        expect(
            run(state, { type: "note-loaded", path: "Ideas.md" }).tabs[0]
                .loading,
        ).toBe(false);
    });
});
