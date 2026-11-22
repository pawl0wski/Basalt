import { describe, expect, it, vi } from "vitest";
import { createNoteOperations } from "./note-operations";
import type { WorkspaceFileSystem } from "./ports";
import type { AppErrorDetail } from "./result";
import { createInMemoryWorkspaceFileSystem } from "./testing/in-memory-workspace-file-system";
import { createInMemoryWorkspaceTrash } from "./testing/in-memory-workspace-trash";
import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

function p(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(input);
    return result.value;
}

const encode = (text: string) => new TextEncoder().encode(text);

function setup(
    files: Record<string, string> = {},
    options: { readOnly?: boolean } = {},
    wrap: (fs: WorkspaceFileSystem) => WorkspaceFileSystem = (fs) => fs,
) {
    const seeded = createInMemoryWorkspaceFileSystem();
    for (const [name, text] of Object.entries(files)) {
        if (name.endsWith("/")) {
            void seeded.mkdir(p(name.slice(0, -1)));
        } else {
            seeded.externalWrite(p(name), encode(text));
        }
    }
    const memory = options.readOnly
        ? createInMemoryWorkspaceFileSystem({
              readOnly: true,
              state: seeded.getState(),
          })
        : seeded;
    const trash = createInMemoryWorkspaceTrash(
        (path) => memory.externalDelete(path),
        { readOnly: () => options.readOnly === true },
    );
    const ops = createNoteOperations({ fs: wrap(memory), trash });
    const paths = async () => {
        const listing = await memory.list();
        if (!listing.ok) throw new Error("list failed");
        return listing.value.map((entry) => entry.path as string).sort();
    };
    const text = async (path: string) => {
        const result = await memory.readText(p(path));
        return result.ok ? result.value : null;
    };
    return { memory, ops, paths, text, trash };
}

function errorOf<T>(
    result: {
        ok: boolean;
        error?: { code: string; message: string; detail?: AppErrorDetail };
    } & T,
) {
    if (result.ok || !result.error) throw new Error("expected an error");
    return result.error;
}

describe("renameNote", () => {
    it("renames the file in place, keeps its folder and content", async () => {
        const { ops, paths, text } = setup({ "docs/old.md": "# Keep" });

        const result = await ops.renameNote({
            path: p("docs/old.md"),
            newName: "New name",
        });

        expect(result).toEqual({
            ok: true,
            value: { path: "docs/New name.md" },
        });
        expect(await paths()).toEqual(["docs", "docs/New name.md"]);
        expect(await text("docs/New name.md")).toBe("# Keep");
    });

    it("does not rewrite links when renaming within the same folder", async () => {
        const { ops, text } = setup({ "d/a.md": "[x](../y.md)" });

        await ops.renameNote({ path: p("d/a.md"), newName: "b" });

        expect(await text("d/b.md")).toBe("[x](../y.md)");
    });

    it("allows a case-only change of the note's own name", async () => {
        const { ops, paths } = setup({ "note.md": "x" });

        const result = await ops.renameNote({
            path: p("note.md"),
            newName: "Note",
        });

        expect(result).toEqual({ ok: true, value: { path: "Note.md" } });
        expect(await paths()).toEqual(["Note.md"]);
    });

    it("treats an unchanged name as success without touching the file system", async () => {
        const { memory, ops } = setup({ "a.md": "x" });
        const events = vi.fn();
        await memory.watch(events);

        const result = await ops.renameNote({ path: p("a.md"), newName: "a" });

        expect(result).toEqual({ ok: true, value: { path: "a.md" } });
        expect(events).not.toHaveBeenCalled();
    });

    it("rejects a name that collides with a sibling by case and keeps both", async () => {
        const { ops, paths } = setup({ "Foo.md": "1", "bar.md": "2" });

        const result = await ops.renameNote({
            path: p("bar.md"),
            newName: "foo",
        });

        expect(errorOf(result).code).toBe("already-exists");
        expect(await paths()).toEqual(["Foo.md", "bar.md"]);
    });

    it("rejects a name that collides with a sibling only by Unicode form", async () => {
        const nfd = "Zazółc";
        const { ops, paths } = setup({ [`${nfd}.md`]: "1", "other.md": "2" });

        const result = await ops.renameNote({
            path: p("other.md"),
            newName: "Zazółc",
        });

        expect(errorOf(result).code).toBe("already-exists");
        expect(await paths()).toEqual([`${nfd}.md`, "other.md"]);
    });

    it("allows the same name as a note in another folder", async () => {
        const { ops } = setup({ "a/x.md": "1", "b/y.md": "2" });

        const result = await ops.renameNote({
            path: p("b/y.md"),
            newName: "x",
        });

        expect(result.ok).toBe(true);
    });

    it("rejects a name that collides with a folder", async () => {
        const { ops } = setup({ "a.md": "1", "b.md/": "" });

        const result = await ops.renameNote({ path: p("a.md"), newName: "b" });

        expect(errorOf(result).code).toBe("already-exists");
    });

    it.each([
        "",
        "..",
        "a/b",
        "a\\b",
        "bad:name",
        "con",
        "trailing.",
        ".hidden",
        "x ".padEnd(300, "x"),
    ])(
        "rejects the invalid name %j without changing anything",
        async (newName) => {
            const { ops, paths } = setup({ "a.md": "x" });

            const result = await ops.renameNote({ path: p("a.md"), newName });

            expect(errorOf(result).code).toBe("invalid-path");
            expect(await paths()).toEqual(["a.md"]);
        },
    );

    it("reports not-found for a missing note", async () => {
        const { ops } = setup({ "a.md": "x" });

        const result = await ops.renameNote({
            path: p("gone.md"),
            newName: "b",
        });

        expect(errorOf(result).code).toBe("not-found");
    });

    it("refuses to rename a folder or a non-Markdown file as a note", async () => {
        const { ops, paths } = setup({ "d/": "", "pic.png": "x" });

        const folder = await ops.renameNote({ path: p("d"), newName: "e" });
        const image = await ops.renameNote({
            path: p("pic.png"),
            newName: "e",
        });

        expect(errorOf(folder).code).toBe("invalid-path");
        expect(errorOf(image).code).toBe("invalid-path");
        expect(await paths()).toEqual(["d", "pic.png"]);
    });

    it("reports permission-denied in a read-only workspace and changes nothing", async () => {
        const { ops, paths } = setup({ "a.md": "x" }, { readOnly: true });

        const result = await ops.renameNote({ path: p("a.md"), newName: "b" });

        expect(errorOf(result).code).toBe("permission-denied");
        expect(await paths()).toEqual(["a.md"]);
    });

    it("surfaces already-exists when the target appears after the check", async () => {
        const { ops } = setup({ "a.md": "1" }, {}, (fs) => ({
            ...fs,
            rename: async () => ({
                ok: false,
                error: { code: "already-exists", message: "raced" },
            }),
        }));

        const result = await ops.renameNote({ path: p("a.md"), newName: "b" });

        expect(errorOf(result)).toEqual({
            code: "already-exists",
            message: "raced",
        });
    });

    it("passes a list failure through", async () => {
        const { ops } = setup({ "a.md": "1" }, {}, (fs) => ({
            ...fs,
            list: async () => ({
                ok: false,
                error: { code: "unavailable", message: "gone" },
            }),
        }));

        const result = await ops.renameNote({ path: p("a.md"), newName: "b" });

        expect(errorOf(result).code).toBe("unavailable");
    });
});

describe("moveNotes", () => {
    it("moves a note into a folder and rewrites its relative links", async () => {
        const { ops, paths, text } = setup({
            "n.md": "[a](plan.md) ![i](attachments/x.png) [w](https://e.com)",
            "docs/": "",
        });

        const result = await ops.moveNotes({
            paths: [p("n.md")],
            destinationFolder: p("docs"),
        });

        expect(result).toEqual({
            ok: true,
            value: { moved: [{ from: "n.md", to: "docs/n.md" }] },
        });
        expect(await paths()).toEqual(["docs", "docs/n.md"]);
        expect(await text("docs/n.md")).toBe(
            "[a](../plan.md) ![i](../attachments/x.png) [w](https://e.com)",
        );
    });

    it("moves a note to the workspace root and rewrites links out of the folder", async () => {
        const { ops, text } = setup({ "d/n.md": "[a](../x.md) [b](y.md)" });

        const result = await ops.moveNotes({
            paths: [p("d/n.md")],
            destinationFolder: null,
        });

        expect(result.ok).toBe(true);
        expect(await text("n.md")).toBe("[a](x.md) [b](d/y.md)");
    });

    it("keeps a BOM and CRLF line endings when it rewrites links", async () => {
        const { ops, text } = setup({
            "n.md": "﻿[ref]: x.md\r\n\r\n[a][ref]\r\n",
            "d/": "",
        });

        await ops.moveNotes({ paths: [p("n.md")], destinationFolder: p("d") });

        expect(await text("d/n.md")).toBe(
            "﻿[ref]: ../x.md\r\n\r\n[a][ref]\r\n",
        );
    });

    it("does not write the note again when no link changed", async () => {
        const writeTextAtomic = vi.fn();
        const { ops, text } = setup(
            { "n.md": "plain [w](https://e.com)", "d/": "" },
            {},
            (fs) => ({
                ...fs,
                writeTextAtomic,
            }),
        );

        await ops.moveNotes({ paths: [p("n.md")], destinationFolder: p("d") });

        expect(writeTextAtomic).not.toHaveBeenCalled();
        expect(await text("d/n.md")).toBe("plain [w](https://e.com)");
    });

    it("ignores a note already in the destination folder without an error", async () => {
        const { memory, ops } = setup({ "d/n.md": "x", "m.md": "y" });
        const events = vi.fn();
        await memory.watch(events);

        const same = await ops.moveNotes({
            paths: [p("d/n.md")],
            destinationFolder: p("d"),
        });
        const root = await ops.moveNotes({
            paths: [p("m.md")],
            destinationFolder: null,
        });

        expect(same).toEqual({ ok: true, value: { moved: [] } });
        expect(root).toEqual({ ok: true, value: { moved: [] } });
        expect(events).not.toHaveBeenCalled();
    });

    it("skips notes already in the destination and moves the others", async () => {
        const { ops, paths } = setup({ "d/a.md": "1", "b.md": "2" });

        const result = await ops.moveNotes({
            paths: [p("d/a.md"), p("b.md")],
            destinationFolder: p("d"),
        });

        expect(result).toEqual({
            ok: true,
            value: { moved: [{ from: "b.md", to: "d/b.md" }] },
        });
        expect(await paths()).toEqual(["d", "d/a.md", "d/b.md"]);
    });

    it("moves nothing and names the first collision when any note collides", async () => {
        const { ops, paths } = setup({
            "a.md": "1",
            "b.md": "2",
            "c.md": "3",
            "d/B.md": "taken",
            "d/C.md": "taken",
        });

        const result = await ops.moveNotes({
            paths: [p("a.md"), p("b.md"), p("c.md")],
            destinationFolder: p("d"),
        });

        const error = errorOf(result);
        expect(error.code).toBe("already-exists");
        expect(error.message).toContain("b.md");
        expect(error.message).not.toContain("c.md");
        expect(error.detail).toEqual({ kind: "move-collision", name: "b.md" });
        expect(await paths()).toEqual([
            "a.md",
            "b.md",
            "c.md",
            "d",
            "d/B.md",
            "d/C.md",
        ]);
    });

    it("detects two selected notes that would land on the same name", async () => {
        const { ops, paths } = setup({
            "x/n.md": "1",
            "y/n.md": "2",
            "d/": "",
        });

        const result = await ops.moveNotes({
            paths: [p("x/n.md"), p("y/n.md")],
            destinationFolder: p("d"),
        });

        const error = errorOf(result);
        expect(error.code).toBe("already-exists");
        expect(error.message).toContain("n.md");
        expect(await paths()).toEqual(["d", "x", "x/n.md", "y", "y/n.md"]);
    });

    it("moves a duplicated path only once", async () => {
        const { ops } = setup({ "a.md": "1", "d/": "" });

        const result = await ops.moveNotes({
            paths: [p("a.md"), p("a.md")],
            destinationFolder: p("d"),
        });

        expect(result).toEqual({
            ok: true,
            value: { moved: [{ from: "a.md", to: "d/a.md" }] },
        });
    });

    it("rejects a missing or non-folder destination and a missing or non-note source before moving", async () => {
        const { ops, paths } = setup({
            "a.md": "1",
            "f.md": "2",
            "pic.png": "3",
            "d/": "",
        });

        const noFolder = await ops.moveNotes({
            paths: [p("a.md")],
            destinationFolder: p("zzz"),
        });
        const fileAsFolder = await ops.moveNotes({
            paths: [p("a.md")],
            destinationFolder: p("f.md"),
        });
        const missing = await ops.moveNotes({
            paths: [p("a.md"), p("gone.md")],
            destinationFolder: p("d"),
        });
        const image = await ops.moveNotes({
            paths: [p("a.md"), p("pic.png")],
            destinationFolder: p("d"),
        });

        expect(errorOf(noFolder).code).toBe("not-found");
        expect(errorOf(fileAsFolder).code).toBe("invalid-path");
        expect(errorOf(missing).code).toBe("not-found");
        expect(errorOf(image).code).toBe("invalid-path");
        expect(await paths()).toEqual(["a.md", "d", "f.md", "pic.png"]);
    });

    it("rejects a hidden destination folder", async () => {
        const { ops, paths } = setup({ "a.md": "1", ".git/": "" });

        const result = await ops.moveNotes({
            paths: [p("a.md")],
            destinationFolder: p(".git"),
        });

        expect(errorOf(result).code).toBe("invalid-path");
        expect(await paths()).toEqual([".git", "a.md"]);
    });

    it("reports permission-denied in a read-only workspace and changes nothing", async () => {
        const { ops, paths } = setup(
            { "a.md": "1", "d/": "" },
            { readOnly: true },
        );

        const result = await ops.moveNotes({
            paths: [p("a.md")],
            destinationFolder: p("d"),
        });

        const error = errorOf(result);
        expect(error.code).toBe("permission-denied");
        expect(error.message).not.toMatch(/Moved \d/);
        expect(await paths()).toEqual(["a.md", "d"]);
    });

    it("stops at an I/O failure midway, keeps earlier moves and reports the count and the failing note", async () => {
        let calls = 0;
        const { ops, paths } = setup(
            { "a.md": "1", "b.md": "2", "c.md": "3", "d/": "" },
            {},
            (fs) => ({
                ...fs,
                rename: async (from, to) => {
                    calls += 1;
                    if (calls === 2) {
                        return {
                            ok: false,
                            error: { code: "unknown", message: "disk error" },
                        };
                    }
                    return fs.rename(from, to);
                },
            }),
        );
        const onMoved = vi.fn();

        const result = await ops.moveNotes({
            paths: [p("a.md"), p("b.md"), p("c.md")],
            destinationFolder: p("d"),
            onMoved,
        });

        const error = errorOf(result);
        expect(error.code).toBe("unknown");
        expect(error.message).toContain("Moved 1 of 3");
        expect(error.message).toContain("b.md");
        expect(error.message).toContain("disk error");
        expect(error.detail).toEqual({
            kind: "move-stopped",
            name: "b.md",
            moved: 1,
            total: 3,
            linksOnly: false,
        });
        expect(onMoved.mock.calls).toEqual([[{ from: "a.md", to: "d/a.md" }]]);
        expect(await paths()).toEqual(["b.md", "c.md", "d", "d/a.md"]);
    });

    it("keeps a note moved when its links cannot be updated and says so", async () => {
        const { ops, paths, text } = setup(
            { "n.md": "[a](x.md)", "d/": "" },
            {},
            (fs) => ({
                ...fs,
                writeTextAtomic: async () => ({
                    ok: false,
                    error: { code: "unknown", message: "write failed" },
                }),
            }),
        );
        const onMoved = vi.fn();

        const result = await ops.moveNotes({
            paths: [p("n.md")],
            destinationFolder: p("d"),
            onMoved,
        });

        const error = errorOf(result);
        expect(error.message).toContain(
            "moved but its links could not be updated",
        );
        expect(error.message).toContain("write failed");
        expect(error.detail).toMatchObject({
            kind: "move-stopped",
            name: "n.md",
            linksOnly: true,
        });
        expect(onMoved).toHaveBeenCalledWith({ from: "n.md", to: "d/n.md" });
        expect(await paths()).toEqual(["d", "d/n.md"]);
        expect(await text("d/n.md")).toBe("[a](x.md)");
    });

    it("keeps a moved note whose text cannot be read and stops the run", async () => {
        const { memory, ops, paths } = setup({ "d/": "" });
        memory.externalWrite(p("bin.md"), Uint8Array.of(0xff, 0xfe));
        memory.externalWrite(p("ok.md"), encode("[a](x.md)"));

        const result = await ops.moveNotes({
            paths: [p("bin.md"), p("ok.md")],
            destinationFolder: p("d"),
        });

        const error = errorOf(result);
        expect(error.code).toBe("not-utf8");
        expect(error.message).toContain("bin.md");
        expect(await paths()).toEqual(["d", "d/bin.md", "ok.md"]);
    });

    it("moves nothing when the listing fails", async () => {
        const rename = vi.fn();
        const { ops } = setup({ "a.md": "1" }, {}, (fs) => ({
            ...fs,
            rename,
            list: async () => ({
                ok: false,
                error: { code: "unavailable", message: "gone" },
            }),
        }));

        const result = await ops.moveNotes({
            paths: [p("a.md")],
            destinationFolder: null,
        });

        expect(errorOf(result).code).toBe("unavailable");
        expect(rename).not.toHaveBeenCalled();
    });
});

describe("createFolder", () => {
    it("creates an empty folder in the workspace root", async () => {
        const { ops, paths } = setup({ "a.md": "x" });

        const result = await ops.createFolder({ parent: null, name: "Ideas" });

        expect(result).toEqual({ ok: true, value: { path: "Ideas" } });
        expect(await paths()).toEqual(["Ideas", "a.md"]);
    });

    it("creates a folder inside an existing folder", async () => {
        const { ops, paths } = setup({ "docs/a.md": "x" });

        const result = await ops.createFolder({
            parent: p("docs"),
            name: "2026",
        });

        expect(result).toEqual({ ok: true, value: { path: "docs/2026" } });
        expect(await paths()).toEqual(["docs", "docs/2026", "docs/a.md"]);
    });

    it("allows a name that exists in another folder", async () => {
        const { ops } = setup({ "other/2026/": "" });

        const result = await ops.createFolder({
            parent: null,
            name: "2026",
        });

        expect(result.ok).toBe(true);
    });

    it.each([
        ["a case-only collision with a folder", "docs/", "DOCS"],
        ["a case-only collision with a note", "Ideas.md", "ideas.md"],
        ["a Unicode-form-only collision", "Cafe\u0301/", "Caf\u00e9"],
        ["a collision with a non-Markdown file", "data.txt", "data.txt"],
        ["a collision with a hidden folder", ".git/", ".git"],
    ])(
        "rejects %s without touching the workspace",
        async (_label, seed, name) => {
            const files: Record<string, string> = { [seed]: "x" };
            const { ops, paths } = setup(files);
            const before = await paths();

            const result = await ops.createFolder({ parent: null, name });

            expect(errorOf(result).code).toBe(
                name.startsWith(".") ? "invalid-path" : "already-exists",
            );
            expect(await paths()).toEqual(before);
        },
    );

    it.each([
        "",
        "..",
        "a/b",
        "a\\b",
        "a:b",
        "CON",
        "trailing.",
        "trailing ",
        ".hidden",
    ])("rejects the invalid name %j", async (name) => {
        const { ops, paths } = setup();

        const result = await ops.createFolder({ parent: null, name });

        expect(errorOf(result).code).toBe("invalid-path");
        expect(await paths()).toEqual([]);
    });

    it("fails with not-found for a missing parent and does not create it", async () => {
        const { ops, paths } = setup();

        const result = await ops.createFolder({ parent: p("gone"), name: "x" });

        expect(errorOf(result).code).toBe("not-found");
        expect(await paths()).toEqual([]);
    });

    it("rejects a note as the parent", async () => {
        const { ops, paths } = setup({ "a.md": "x" });

        const result = await ops.createFolder({ parent: p("a.md"), name: "x" });

        expect(errorOf(result).code).toBe("invalid-path");
        expect(await paths()).toEqual(["a.md"]);
    });

    it("reports permission-denied in a read-only workspace and creates nothing", async () => {
        const { ops, paths } = setup({ "docs/a.md": "x" }, { readOnly: true });

        const result = await ops.createFolder({ parent: p("docs"), name: "x" });

        expect(errorOf(result).code).toBe("permission-denied");
        expect(await paths()).toEqual(["docs", "docs/a.md"]);
    });
});

describe("deleteNotes", () => {
    it("deletes a note and removes it from the workspace", async () => {
        const { ops, paths } = setup({ "a.md": "1", "b.md": "2" });

        const result = await ops.deleteNotes({ paths: [p("a.md")] });

        expect(result.ok && result.value.deleted).toEqual([p("a.md")]);
        expect(result.ok && result.value.failed).toEqual([]);
        expect(await paths()).toEqual(["b.md"]);
    });

    it("deletes several notes at once", async () => {
        const { ops, paths } = setup({
            "a.md": "1",
            "b.md": "2",
            "docs/c.md": "3",
        });

        const result = await ops.deleteNotes({
            paths: [p("a.md"), p("docs/c.md")],
        });

        expect(result.ok && result.value.deleted).toEqual([
            p("a.md"),
            p("docs/c.md"),
        ]);
        expect(await paths()).toEqual(["b.md", "docs"]);
    });

    it("reports a path that is not a note as failed and deletes the rest", async () => {
        const { ops, paths } = setup({ "a.md": "1" });

        const result = await ops.deleteNotes({
            paths: [p("a.md"), p("gone.md")],
        });

        expect(result.ok && result.value.deleted).toEqual([p("a.md")]);
        if (!result.ok) throw new Error("expected ok");
        expect(result.value.failed.map((entry) => entry.path)).toEqual([
            p("gone.md"),
        ]);
        expect(result.value.failed[0]?.error.code).toBe("not-found");
        expect(await paths()).toEqual([]);
    });

    it("reports permission-denied for every note in a read-only workspace and deletes none", async () => {
        const { ops, paths } = setup(
            { "a.md": "1", "b.md": "2" },
            { readOnly: true },
        );

        const result = await ops.deleteNotes({
            paths: [p("a.md"), p("b.md")],
        });

        expect(result.ok && result.value.deleted).toEqual([]);
        if (!result.ok) throw new Error("expected ok");
        expect(result.value.failed.map((entry) => entry.error.code)).toEqual([
            "permission-denied",
            "permission-denied",
        ]);
        expect(await paths()).toEqual(["a.md", "b.md"]);
    });

    it("continues past a failure and reports the notes that were not deleted", async () => {
        const { ops, paths, trash } = setup({
            "a.md": "1",
            "b.md": "2",
            "c.md": "3",
        });
        trash.failNext();

        const result = await ops.deleteNotes({
            paths: [p("a.md"), p("b.md"), p("c.md")],
        });

        expect(result.ok && result.value.deleted).toEqual([
            p("b.md"),
            p("c.md"),
        ]);
        if (!result.ok) throw new Error("expected ok");
        expect(result.value.failed.map((entry) => entry.path)).toEqual([
            p("a.md"),
        ]);
        expect(await paths()).toEqual(["a.md"]);
    });

    it("deletes nothing for an empty list", async () => {
        const { ops, paths } = setup({ "a.md": "1" });

        const result = await ops.deleteNotes({ paths: [] });

        expect(result.ok && result.value.deleted).toEqual([]);
        expect(await paths()).toEqual(["a.md"]);
    });
});

describe("renameNoteByTitle", () => {
    it("sets the first heading and renames the file", async () => {
        const { ops, paths, text } = setup({ "Untitled.md": "# \nbody" });

        const result = await ops.renameNoteByTitle({
            path: p("Untitled.md"),
            title: "Plan",
        });

        expect(result.ok && result.value.path).toBe("Plan.md");
        expect(await paths()).toEqual(["Plan.md"]);
        expect(await text("Plan.md")).toBe("# Plan\nbody");
    });

    it("inserts a heading into a note without one", async () => {
        const { ops, text } = setup({ "a.md": "body" });

        await ops.renameNoteByTitle({ path: p("a.md"), title: "B" });

        expect(await text("B.md")).toBe("# B\n\nbody");
    });

    it("rewrites the note's own links to itself and keeps the BOM and CRLF", async () => {
        const { ops, text } = setup({
            "a.md": "\uFEFF# Old\r\n[self](a.md)\r\n",
        });

        await ops.renameNoteByTitle({ path: p("a.md"), title: "New" });

        expect(await text("New.md")).toBe("\uFEFF# New\r\n[self](New.md)\r\n");
    });

    it("renames a case-only change and keeps the heading", async () => {
        const { ops, paths } = setup({ "test.md": "# test" });

        const result = await ops.renameNoteByTitle({
            path: p("test.md"),
            title: "Test",
        });

        expect(result.ok).toBe(true);
        expect(await paths()).toEqual(["Test.md"]);
    });

    it("rejects a colliding title without touching the note", async () => {
        const { ops, paths, text } = setup({
            "a.md": "# A",
            "Taken.md": "x",
        });

        const result = await ops.renameNoteByTitle({
            path: p("a.md"),
            title: "taken",
        });

        expect(errorOf(result).code).toBe("already-exists");
        expect(await paths()).toEqual(["Taken.md", "a.md"]);
        expect(await text("a.md")).toBe("# A");
    });

    it.each(["a/b", "a:b", "con", ".hidden", "", "x."])(
        "rejects the invalid title %j",
        async (title) => {
            const { ops, text } = setup({ "a.md": "# A" });

            const result = await ops.renameNoteByTitle({
                path: p("a.md"),
                title,
            });

            expect(errorOf(result).code).toBe("invalid-path");
            expect(await text("a.md")).toBe("# A");
        },
    );

    it("reports not-found and invalid-path for a missing or non-note path", async () => {
        const { ops } = setup({ "pic.png": "x" });

        expect(
            errorOf(
                await ops.renameNoteByTitle({ path: p("no.md"), title: "A" }),
            ).code,
        ).toBe("not-found");
        expect(
            errorOf(
                await ops.renameNoteByTitle({ path: p("pic.png"), title: "A" }),
            ).code,
        ).toBe("invalid-path");
    });

    it("reports permission-denied in a read-only workspace and changes nothing", async () => {
        const { ops, text, paths } = setup(
            { "a.md": "# A" },
            { readOnly: true },
        );

        const result = await ops.renameNoteByTitle({
            path: p("a.md"),
            title: "B",
        });

        expect(errorOf(result).code).toBe("permission-denied");
        expect(await paths()).toEqual(["a.md"]);
        expect(await text("a.md")).toBe("# A");
    });

    it("keeps the new heading when the rename fails so the next attempt can retry", async () => {
        const { ops, text } = setup({ "a.md": "# A" }, {}, (fs) => ({
            ...fs,
            rename: async () => ({
                ok: false,
                error: { code: "unknown", message: "nope" },
            }),
        }));

        const result = await ops.renameNoteByTitle({
            path: p("a.md"),
            title: "B",
        });

        expect(result.ok).toBe(false);
        expect(await text("a.md")).toBe("# B");
    });

    it("writes nothing when the heading already matches and only the case changes nothing else", async () => {
        const { ops, memory } = setup({ "A.md": "# A" });
        const write = vi.spyOn(memory, "writeTextAtomic");

        const result = await ops.renameNoteByTitle({
            path: p("A.md"),
            title: "A",
        });

        expect(result.ok).toBe(true);
        expect(write).not.toHaveBeenCalled();
    });
});

describe("rewriteIncomingLinks", () => {
    it("rewrites links in other notes, in folders, and skips the listed notes", async () => {
        const { ops, text } = setup({
            "a.md": "[x](Old.md)",
            "dir/b.md": "[x](../Old.md)",
            "skipped.md": "[x](Old.md)",
            "Old.md": "[self](Old.md)",
            "c.md": "no links",
        });

        const result = await ops.rewriteIncomingLinks({
            oldPath: p("Old.md"),
            newPath: p("New.md"),
            skip: [p("skipped.md")],
        });

        expect(result.ok && [...result.value.changed].sort()).toEqual([
            "a.md",
            "dir/b.md",
        ]);
        expect(await text("a.md")).toBe("[x](New.md)");
        expect(await text("dir/b.md")).toBe("[x](../New.md)");
        expect(await text("skipped.md")).toBe("[x](Old.md)");
        expect(await text("Old.md")).toBe("[self](Old.md)");
    });

    it("keeps the BOM and writes only changed notes", async () => {
        const { ops, memory, text } = setup({
            "a.md": "\uFEFF[x](Old.md)",
            "b.md": "[x](Other.md)",
        });
        const write = vi.spyOn(memory, "writeTextAtomic");

        await ops.rewriteIncomingLinks({
            oldPath: p("Old.md"),
            newPath: p("New.md"),
            skip: [],
        });

        expect(write).toHaveBeenCalledTimes(1);
        expect(await text("a.md")).toBe("\uFEFF[x](New.md)");
    });

    it("is idempotent", async () => {
        const { ops, memory } = setup({ "a.md": "[x](Old.md)" });
        const input = {
            oldPath: p("Old.md"),
            newPath: p("New.md"),
            skip: [],
        };
        await ops.rewriteIncomingLinks(input);
        const write = vi.spyOn(memory, "writeTextAtomic");

        const again = await ops.rewriteIncomingLinks(input);

        expect(again.ok && again.value.changed).toEqual([]);
        expect(write).not.toHaveBeenCalled();
    });

    it("continues past a note that cannot be written and reports it", async () => {
        const { ops, text } = setup(
            { "a.md": "[x](Old.md)", "b.md": "[x](Old.md)" },
            {},
            (fs) => ({
                ...fs,
                writeTextAtomic: async (path, content) =>
                    path === "a.md"
                        ? {
                              ok: false,
                              error: { code: "unknown", message: "no" },
                          }
                        : fs.writeTextAtomic(path, content),
            }),
        );

        const result = await ops.rewriteIncomingLinks({
            oldPath: p("Old.md"),
            newPath: p("New.md"),
            skip: [],
        });

        expect(result.ok && result.value.changed).toEqual(["b.md"]);
        expect(result.ok && result.value.failed.map((f) => f.path)).toEqual([
            "a.md",
        ]);
        expect(await text("b.md")).toBe("[x](New.md)");
    });

    it("ignores dot folders and non-Markdown files", async () => {
        const { ops, text } = setup({
            ".hidden/a.md": "[x](Old.md)",
            "notes.txt": "[x](Old.md)",
        });

        const result = await ops.rewriteIncomingLinks({
            oldPath: p("Old.md"),
            newPath: p("New.md"),
            skip: [],
        });

        expect(result.ok && result.value.changed).toEqual([]);
        expect(await text("notes.txt")).toBe("[x](Old.md)");
    });
});
