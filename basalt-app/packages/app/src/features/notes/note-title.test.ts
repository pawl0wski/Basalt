import { describe, expect, it } from "vitest";
import { createHarness, root, seedFs, wsPath } from "../test-harness";

const A = root("/a");

async function setup(
    files: Record<string, string>,
    options: Parameters<typeof seedFs>[1] = {},
) {
    const fs = seedFs(files, options);
    const h = createHarness({ workspaces: { [A]: fs }, picked: A });
    await h.workspaceActions.openWorkspace();
    const state = () => h.notesStore.getState();
    const sessionOf = (path: string) =>
        state().openNotes.find((note) => note.path === path);
    const text = async (path: string) => {
        const result = await fs.readText(wsPath(path));
        return result.ok ? result.value : null;
    };
    const paths = async () => {
        const listing = await fs.list();
        return listing.ok
            ? listing.value.map((entry) => entry.path as string).sort()
            : [];
    };
    return { h, fs, state, sessionOf, text, paths };
}

async function open(
    t: Awaited<ReturnType<typeof setup>>,
    path: string,
): Promise<void> {
    await t.h.notesActions.openNote(wsPath(path));
}

describe("creating a note", () => {
    it("writes an empty first heading, asks for the cursor after it and marks the title pending", async () => {
        const t = await setup({});

        await t.h.notesActions.createNote();

        expect(await t.text("Untitled.md")).toBe("# ");
        expect(t.state().focusRequest).toMatchObject({ position: 2 });
        expect(t.sessionOf("Untitled.md")?.titlePending).toBe(true);
    });
});

describe("marking the title pending", () => {
    it("marks it when an edit changes the first heading", async () => {
        const t = await setup({ "n.md": "# A\nbody" });
        await open(t, "n.md");

        t.h.notesActions.updateText(wsPath("n.md"), "# AB\nbody");

        expect(t.sessionOf("n.md")?.titlePending).toBe(true);
    });

    it("does not mark it for an edit below the heading", async () => {
        const t = await setup({ "n.md": "# A\nbody" });
        await open(t, "n.md");

        t.h.notesActions.updateText(wsPath("n.md"), "# A\nbody more");

        expect(t.sessionOf("n.md")?.titlePending).toBe(false);
    });

    it("marks it when a heading appears or disappears", async () => {
        const t = await setup({ "n.md": "body", "m.md": "# H" });
        await open(t, "n.md");
        await open(t, "m.md");

        t.h.notesActions.updateText(wsPath("n.md"), "# New\nbody");
        t.h.notesActions.updateText(wsPath("m.md"), "text");

        expect(t.sessionOf("n.md")?.titlePending).toBe(true);
        expect(t.sessionOf("m.md")?.titlePending).toBe(true);
    });
});

describe("committing the title", () => {
    it("renames the file to the heading and keeps the session id and the text", async () => {
        const t = await setup({ "Untitled.md": "# " });
        await open(t, "Untitled.md");
        const id = t.sessionOf("Untitled.md")?.id;
        t.h.notesActions.updateText(wsPath("Untitled.md"), "# Test\nbody");

        await t.h.notesActions.commitTitle(wsPath("Untitled.md"));

        expect(await t.paths()).toEqual(["Test.md"]);
        expect(t.sessionOf("Test.md")).toMatchObject({
            id,
            text: "# Test\nbody",
            titlePending: false,
            titleError: null,
        });
        expect(t.state().activeNote).toBe("Test.md");
    });

    it("saves the pending text before the file is renamed", async () => {
        const t = await setup({ "Untitled.md": "# " });
        await open(t, "Untitled.md");
        t.h.notesActions.updateText(wsPath("Untitled.md"), "# Test\nbody");

        await t.h.notesActions.commitTitle(wsPath("Untitled.md"));

        expect(await t.text("Test.md")).toBe("# Test\nbody");
    });

    it("does nothing when the title is not pending", async () => {
        const t = await setup({ "n.md": "# Different" });
        await open(t, "n.md");

        await t.h.notesActions.commitTitle(wsPath("n.md"));

        expect(await t.paths()).toEqual(["n.md"]);
    });

    it("restores an emptied heading to the file name without renaming", async () => {
        const t = await setup({ "Plan.md": "# Plan\nbody" });
        await open(t, "Plan.md");
        t.h.notesActions.updateText(wsPath("Plan.md"), "# \nbody");

        await t.h.notesActions.commitTitle(wsPath("Plan.md"));

        expect(t.sessionOf("Plan.md")).toMatchObject({
            text: "# Plan\nbody",
            titlePending: false,
            titleError: null,
        });
        expect(await t.paths()).toEqual(["Plan.md"]);
    });

    it("is a no-op when the heading equals the file name", async () => {
        const t = await setup({ "Plan.md": "# Plan" });
        await open(t, "Plan.md");
        t.h.notesActions.updateText(wsPath("Plan.md"), "# Plan x");
        t.h.notesActions.updateText(wsPath("Plan.md"), "# Plan");

        await t.h.notesActions.commitTitle(wsPath("Plan.md"));

        expect(await t.paths()).toEqual(["Plan.md"]);
        expect(t.sessionOf("Plan.md")?.titlePending).toBe(false);
    });

    it("does not rename a note without a heading", async () => {
        const t = await setup({ "n.md": "# x" });
        await open(t, "n.md");
        t.h.notesActions.updateText(wsPath("n.md"), "no heading");

        await t.h.notesActions.commitTitle(wsPath("n.md"));

        expect(await t.paths()).toEqual(["n.md"]);
        expect(t.sessionOf("n.md")?.titlePending).toBe(false);
    });

    it("renames on a case-only change", async () => {
        const t = await setup({ "plan.md": "# plan" });
        await open(t, "plan.md");
        t.h.notesActions.updateText(wsPath("plan.md"), "# Plan");

        await t.h.notesActions.commitTitle(wsPath("plan.md"));

        expect(await t.paths()).toEqual(["Plan.md"]);
    });

    it("keeps file and text and reports an invalid heading, retrying on the next commit", async () => {
        const t = await setup({ "n.md": "# n" });
        await open(t, "n.md");
        t.h.notesActions.updateText(wsPath("n.md"), "# a/b");

        await t.h.notesActions.commitTitle(wsPath("n.md"));

        expect(await t.paths()).toEqual(["n.md"]);
        expect(t.sessionOf("n.md")).toMatchObject({
            text: "# a/b",
            titlePending: true,
            titleError: { error: { code: "invalid-path" }, linksFailed: 0 },
        });

        t.h.notesActions.updateText(wsPath("n.md"), "# ab");
        await t.h.notesActions.commitTitle(wsPath("n.md"));

        expect(await t.paths()).toEqual(["ab.md"]);
        expect(t.sessionOf("ab.md")?.titleError).toBeNull();
    });

    it("keeps file and text and reports a colliding heading", async () => {
        const t = await setup({ "n.md": "# n", "Taken.md": "x" });
        await open(t, "n.md");
        t.h.notesActions.updateText(wsPath("n.md"), "# taken");

        await t.h.notesActions.commitTitle(wsPath("n.md"));

        expect(await t.paths()).toEqual(["Taken.md", "n.md"]);
        expect(t.sessionOf("n.md")?.titleError?.error.code).toBe(
            "already-exists",
        );
        expect(t.sessionOf("n.md")?.text).toBe("# taken");
    });

    it("reports a read-only workspace and keeps the file name", async () => {
        const t = await setup({ "n.md": "# n" }, { readOnly: true });
        await open(t, "n.md");
        t.h.notesActions.updateText(wsPath("n.md"), "# New");

        await t.h.notesActions.commitTitle(wsPath("n.md"));

        expect(await t.paths()).toEqual(["n.md"]);
        expect(t.sessionOf("n.md")?.titleError?.error.code).toBe(
            "permission-denied",
        );
    });

    it("commits every pending title with commitPendingTitles", async () => {
        const t = await setup({ "a.md": "# a", "b.md": "# b" });
        await open(t, "a.md");
        await open(t, "b.md");
        t.h.notesActions.updateText(wsPath("a.md"), "# Alpha");
        t.h.notesActions.updateText(wsPath("b.md"), "# Beta");

        await t.h.notesActions.commitPendingTitles();

        expect(await t.paths()).toEqual(["Alpha.md", "Beta.md"]);
    });

    it("dismisses the title error", async () => {
        const t = await setup({ "n.md": "# n" });
        await open(t, "n.md");
        t.h.notesActions.updateText(wsPath("n.md"), "# a/b");
        await t.h.notesActions.commitTitle(wsPath("n.md"));

        t.h.notesActions.dismissTitleError(wsPath("n.md"));

        expect(t.sessionOf("n.md")?.titleError).toBeNull();
    });
});

describe("links after a rename", () => {
    it("rewrites links in closed notes on disk and in open notes in memory, including self links", async () => {
        const t = await setup({
            "Old.md": "# Old\n[self](Old.md)",
            "closed.md": "[x](Old.md)",
            "open.md": "[y](Old.md)",
        });
        await open(t, "Old.md");
        await open(t, "open.md");
        t.h.notesActions.updateText(wsPath("Old.md"), "# New\n[self](Old.md)");

        await t.h.notesActions.commitTitle(wsPath("Old.md"));

        expect(await t.text("closed.md")).toBe("[x](New.md)");
        expect(t.sessionOf("open.md")?.text).toBe("[y](New.md)");
        expect(t.sessionOf("New.md")?.text).toBe("# New\n[self](New.md)");
    });

    it("reports how many notes could not be updated while the rename stands", async () => {
        const t = await setup({
            "Old.md": "# Old",
            "a.md": "[x](Old.md)",
            "b.md": "[x](Old.md)",
        });
        await open(t, "Old.md");
        t.h.notesActions.updateText(wsPath("Old.md"), "# New");
        const rename = t.fs.rename.bind(t.fs);
        t.fs.rename = async (from, to) => {
            const result = await rename(from, to);
            t.fs.failNextWrite();
            t.fs.failNextWrite();
            return result;
        };

        await t.h.notesActions.commitTitle(wsPath("Old.md"));

        expect(await t.paths()).toEqual(["New.md", "a.md", "b.md"]);
        expect(t.sessionOf("New.md")?.titleError?.linksFailed).toBeGreaterThan(
            0,
        );
    });
});

describe("renaming from the tree", () => {
    it("sets the heading of an open note and renames the file", async () => {
        const t = await setup({ "Old.md": "# Old\nbody" });
        await open(t, "Old.md");

        const result = await t.h.notesActions.applyTitle(
            wsPath("Old.md"),
            "New",
        );

        expect(result.ok && result.value).toBe("New.md");
        expect(t.sessionOf("New.md")?.text).toBe("# New\nbody");
        expect(t.state().activeNote).toBe("New.md");
        t.h.scheduler.fire();
        await t.h.notesActions.saveNow(wsPath("New.md"));
        expect(await t.text("New.md")).toBe("# New\nbody");
    });

    it("sets the heading of a closed note on disk without opening it", async () => {
        const t = await setup({
            "Old.md": "# Old\nbody",
            "ref.md": "[o](Old.md)",
        });

        const result = await t.h.notesActions.applyTitle(
            wsPath("Old.md"),
            "New",
        );

        expect(result.ok && result.value).toBe("New.md");
        expect(await t.text("New.md")).toBe("# New\nbody");
        expect(await t.text("ref.md")).toBe("[o](New.md)");
        expect(t.state().openNotes).toEqual([]);
    });

    it("inserts a heading into a closed note that has none", async () => {
        const t = await setup({ "Old.md": "body" });

        await t.h.notesActions.applyTitle(wsPath("Old.md"), "New");

        expect(await t.text("New.md")).toBe("# New\n\nbody");
    });

    it("restores the text of an open note when the rename fails", async () => {
        const t = await setup({ "Old.md": "# Old", "Taken.md": "x" });
        await open(t, "Old.md");

        const result = await t.h.notesActions.applyTitle(
            wsPath("Old.md"),
            "Taken",
        );

        expect(result.ok).toBe(false);
        expect(t.sessionOf("Old.md")?.text).toBe("# Old");
        expect(await t.paths()).toEqual(["Old.md", "Taken.md"]);
    });

    it("leaves a closed note untouched when the title collides", async () => {
        const t = await setup({ "Old.md": "# Old", "Taken.md": "x" });

        const result = await t.h.notesActions.applyTitle(
            wsPath("Old.md"),
            "Taken",
        );

        expect(result.ok).toBe(false);
        expect(await t.text("Old.md")).toBe("# Old");
    });
});
