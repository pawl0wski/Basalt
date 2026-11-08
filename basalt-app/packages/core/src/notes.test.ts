import { describe, expect, it } from "vitest";
import { createInMemoryWorkspaceFileSystem } from "./testing";
import { createNotes, isMarkdownPath, MAX_NOTE_BYTES } from "./notes";
import type { WorkspaceFileSystem } from "./ports";
import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

function path(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(`expected valid path: ${input}`);
    return result.value;
}

const encode = (text: string) => new TextEncoder().encode(text);

function setup() {
    const memory = createInMemoryWorkspaceFileSystem();
    return { memory, notes: createNotes({ fs: memory }) };
}

async function bytesOf(
    memory: ReturnType<typeof createInMemoryWorkspaceFileSystem>,
    file: string,
): Promise<number[]> {
    const entry = memory
        .getState()
        .entries.find((candidate) => candidate.path === file);
    if (entry?.kind !== "file") throw new Error(`missing file: ${file}`);
    return [...Uint8Array.from(atob(entry.base64), (c) => c.charCodeAt(0))];
}

function save(
    notes: ReturnType<typeof createNotes>,
    overrides: Partial<
        Parameters<ReturnType<typeof createNotes>["saveNote"]>[0]
    >,
) {
    return notes.saveNote({
        path: path("a.md"),
        text: "x",
        baseText: "x",
        eol: "lf",
        bom: false,
        ...overrides,
    });
}

describe("isMarkdownPath", () => {
    it("matches .md case-insensitively and nothing else", () => {
        expect(isMarkdownPath("a.md")).toBe(true);
        expect(isMarkdownPath("dir/B.MD")).toBe(true);
        expect(isMarkdownPath("a.markdown")).toBe(false);
        expect(isMarkdownPath("a.md.txt")).toBe(false);
        expect(isMarkdownPath("md")).toBe(false);
    });
});

describe("listNotes", () => {
    it("lists only Markdown files, skipping dot-entries, temp files, symlinks and directories", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("one.md"), encode("1"));
        memory.externalWrite(path("Two.MD"), encode("2"));
        memory.externalWrite(path("sub/three.md"), encode("3"));
        memory.externalWrite(path("readme.txt"), encode("x"));
        memory.externalWrite(path(".hidden.md"), encode("x"));
        memory.externalWrite(path(".one.md.basalt-tmp"), encode("x"));
        memory.externalWrite(path(".basalt/inside.md"), encode("x"));
        memory.addSymlink(path("link.md"));
        memory.externalWrite(path("folder.md/inner.txt"), encode("x"));

        const result = await notes.listNotes();

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.map((note) => [note.path, note.name])).toEqual([
            ["Two.MD", "Two"],
            ["one.md", "one"],
            ["sub/three.md", "three"],
        ]);
    });

    it("propagates a file system failure", async () => {
        const { memory, notes } = setup();
        memory.removeRoot();
        const result = await notes.listNotes();
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("unavailable");
    });
});

describe("suggestNoteName", () => {
    it("returns the first free name of baseName, 'baseName 1', ...", async () => {
        const { memory, notes } = setup();
        const none = await notes.listNotes();
        if (!none.ok) throw new Error("list failed");
        expect(notes.suggestNoteName(none.value, "Untitled")).toBe("Untitled");

        memory.externalWrite(path("Untitled.md"), encode(""));
        memory.externalWrite(path("untitled 1.md"), encode(""));
        memory.externalWrite(path("Other 2.md"), encode(""));
        const listed = await notes.listNotes();
        if (!listed.ok) throw new Error("list failed");

        expect(notes.suggestNoteName(listed.value, "Untitled")).toBe(
            "Untitled 2",
        );
        expect(notes.suggestNoteName(listed.value, "Other")).toBe("Other");
        expect(notes.suggestNoteName(listed.value, "Fresh")).toBe("Fresh");
    });

    it("compares Unicode forms equal", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("Café.md"), encode(""));
        const listed = await notes.listNotes();
        if (!listed.ok) throw new Error("list failed");
        expect(notes.suggestNoteName(listed.value, "Café")).toBe("Café 1");
    });
});

describe("createNote", () => {
    it("creates an empty .md file in the workspace root", async () => {
        const { memory, notes } = setup();

        const result = await notes.createNote("Ideas");

        expect(result).toEqual({
            ok: true,
            value: { path: "Ideas.md", name: "Ideas" },
        });
        expect(await bytesOf(memory, "Ideas.md")).toEqual([]);
    });

    it("rejects a case-only collision without auto-suffixing", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("Ideas.md"), encode("keep"));

        const result = await notes.createNote("ideas");

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("already-exists");
        expect(await bytesOf(memory, "Ideas.md")).toEqual([...encode("keep")]);
        expect(memory.getState().entries).toHaveLength(1);
    });

    it("rejects a Unicode-form-only collision", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("Café.md"), encode("keep"));

        const result = await notes.createNote("Café");

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("already-exists");
    });

    it("rejects a collision with a directory or non-Markdown entry", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("Docs.md/inner.txt"), encode("x"));
        const result = await notes.createNote("docs");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("already-exists");
    });

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
        "x".repeat(256),
        "x".repeat(253),
    ])("rejects the invalid or non-root name %j", async (name) => {
        const { memory, notes } = setup();
        const result = await notes.createNote(name);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("invalid-path");
        expect(memory.getState().entries).toHaveLength(0);
    });

    it("reports permission-denied in a read-only workspace without a ghost file", async () => {
        const memory = createInMemoryWorkspaceFileSystem({ readOnly: true });
        const notes = createNotes({ fs: memory });
        const result = await notes.createNote("Ideas");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("permission-denied");
        expect(memory.getState().entries).toHaveLength(0);
    });
});

describe("openNote", () => {
    it("rejects a file over 5 MiB by stat without reading it", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(
            path("big.md"),
            new Uint8Array(MAX_NOTE_BYTES + 1),
        );
        let reads = 0;
        const fs: WorkspaceFileSystem = {
            ...memory,
            readText: (target) => {
                reads += 1;
                return memory.readText(target);
            },
        };

        const result = await createNotes({ fs }).openNote(path("big.md"));

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("too-large");
        expect(reads).toBe(0);
    });

    it("opens a file of exactly 5 MiB", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(
            path("edge.md"),
            new Uint8Array(MAX_NOTE_BYTES).fill(97),
        );
        const result = await notes.openNote(path("edge.md"));
        expect(result.ok).toBe(true);
    });

    it("reports not-utf8 and never writes the file", async () => {
        const { memory, notes } = setup();
        const invalid = Uint8Array.from([0x66, 0xff, 0xfe, 0x6f]);
        memory.externalWrite(path("bad.md"), invalid);

        const opened = await notes.openNote(path("bad.md"));
        const saved = await save(notes, {
            path: path("bad.md"),
            text: "new",
            baseText: "",
        });

        for (const result of [opened, saved]) {
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("not-utf8");
        }
        expect(await bytesOf(memory, "bad.md")).toEqual([...invalid]);
    });

    it("rejects a symlink path as invalid-path", async () => {
        const { memory, notes } = setup();
        memory.addSymlink(path("link.md"));
        const result = await notes.openNote(path("link.md"));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("invalid-path");
    });

    it("rejects a directory path as invalid-path", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("dir/a.md"), encode("x"));
        const result = await notes.openNote(path("dir"));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("invalid-path");
    });

    it("reports not-found for a missing note", async () => {
        const { notes } = setup();
        const result = await notes.openNote(path("missing.md"));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("not-found");
    });

    it("detects the dominant EOL and removes the BOM and CR from the text", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("c.md"), encode("﻿a\r\nb\r\nc"));
        memory.externalWrite(path("l.md"), encode("a\nb"));
        memory.externalWrite(path("m.md"), encode("a\r\nb\nc\nd"));
        memory.externalWrite(path("t.md"), encode("a\r\nb\nc"));

        const results = await Promise.all(
            ["c.md", "l.md", "m.md", "t.md"].map((file) =>
                notes.openNote(path(file)),
            ),
        );

        expect(results.map((r) => (r.ok ? r.value : null))).toEqual([
            { text: "a\nb\nc", eol: "crlf", bom: true },
            { text: "a\nb", eol: "lf", bom: false },
            { text: "a\nb\nc\nd", eol: "lf", bom: false },
            { text: "a\nb\nc", eol: "lf", bom: false },
        ]);
    });
});

describe("saveNote round trip", () => {
    it.each([
        ["LF", "a\nb\n"],
        ["CRLF", "a\r\nb\r\n"],
        ["BOM + LF", "﻿a\nb"],
        ["BOM + CRLF", "﻿a\r\nb\r\nc"],
        ["empty", ""],
        ["BOM only", "﻿"],
    ])("restores %s byte for byte", async (_label, content) => {
        const { memory, notes } = setup();
        memory.externalWrite(path("a.md"), encode(content));
        const opened = await notes.openNote(path("a.md"));
        if (!opened.ok) throw new Error("open failed");

        const result = await notes.saveNote({
            path: path("a.md"),
            text: opened.value.text,
            baseText: opened.value.text,
            eol: opened.value.eol,
            bom: opened.value.bom,
        });

        expect(result.ok).toBe(true);
        expect(await bytesOf(memory, "a.md")).toEqual([...encode(content)]);
    });

    it("writes edited text with the remembered style and returns it as the new baseText", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("a.md"), encode("﻿a\r\nb"));
        const opened = await notes.openNote(path("a.md"));
        if (!opened.ok) throw new Error("open failed");

        const result = await save(notes, {
            text: "a\nb\nc",
            baseText: opened.value.text,
            eol: opened.value.eol,
            bom: opened.value.bom,
        });

        expect(result).toEqual({ ok: true, value: { baseText: "a\nb\nc" } });
        expect(await bytesOf(memory, "a.md")).toEqual([
            ...encode("﻿a\r\nb\r\nc"),
        ]);
    });

    it("writes a mixed-EOL file with its dominant ending after an edit", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("a.md"), encode("a\r\nb\r\nc\nd"));
        const opened = await notes.openNote(path("a.md"));
        if (!opened.ok) throw new Error("open failed");
        expect(opened.value.eol).toBe("crlf");

        await save(notes, {
            text: `${opened.value.text}!`,
            baseText: opened.value.text,
            eol: opened.value.eol,
            bom: opened.value.bom,
        });

        expect(await bytesOf(memory, "a.md")).toEqual([
            ...encode("a\r\nb\r\nc\r\nd!"),
        ]);
    });
});

describe("saveNote conflicts", () => {
    it("does not treat an EOL-only or BOM-only disk change as a conflict and keeps the disk style", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("a.md"), encode("a\nb"));
        memory.externalWrite(path("a.md"), encode("﻿a\r\nb"));

        const result = await save(notes, {
            text: "a\nb\nc",
            baseText: "a\nb",
            eol: "lf",
            bom: false,
        });

        expect(result.ok).toBe(true);
        expect(await bytesOf(memory, "a.md")).toEqual([
            ...encode("﻿a\r\nb\r\nc"),
        ]);
    });

    it("detects an external change even when size and mtime are unchanged", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("a.md"), encode("aaaa"));
        const fs: WorkspaceFileSystem = {
            ...memory,
            stat: async () => ({
                ok: true,
                value: { kind: "file", size: 4, mtimeMs: 1 },
            }),
        };
        memory.externalWrite(path("a.md"), encode("bbbb"));

        const result = await createNotes({ fs }).saveNote({
            path: path("a.md"),
            text: "mine",
            baseText: "aaaa",
            eol: "lf",
            bom: false,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("conflict");
        expect(await bytesOf(memory, "a.md")).toEqual([...encode("bbbb")]);
    });

    it("returns conflict in normal mode and writes in overwrite mode", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("a.md"), encode("theirs"));

        const normal = await save(notes, { text: "mine", baseText: "base" });
        expect(normal.ok).toBe(false);
        if (!normal.ok) expect(normal.error.code).toBe("conflict");
        expect(await bytesOf(memory, "a.md")).toEqual([...encode("theirs")]);

        const overwrite = await save(notes, {
            text: "mine",
            baseText: "base",
            mode: "overwrite",
        });
        expect(overwrite).toEqual({ ok: true, value: { baseText: "mine" } });
        expect(await bytesOf(memory, "a.md")).toEqual([...encode("mine")]);
    });
});

describe("saveNote missing and special files", () => {
    it("returns not-found unless mode is recreate", async () => {
        const { memory, notes } = setup();

        const normal = await save(notes, {});
        const overwrite = await save(notes, { mode: "overwrite" });
        for (const result of [normal, overwrite]) {
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("not-found");
        }
        expect(memory.getState().entries).toHaveLength(0);

        const recreate = await save(notes, {
            text: "a\nb",
            baseText: "old",
            eol: "crlf",
            bom: true,
            mode: "recreate",
        });
        expect(recreate).toEqual({ ok: true, value: { baseText: "a\nb" } });
        expect(await bytesOf(memory, "a.md")).toEqual([...encode("﻿a\r\nb")]);
    });

    it("rejects saving to a symlink", async () => {
        const { memory, notes } = setup();
        memory.addSymlink(path("a.md"));
        const result = await save(notes, { mode: "recreate" });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("invalid-path");
    });

    it("AC3: a failing write returns the error and leaves the original untouched", async () => {
        const { memory, notes } = setup();
        memory.externalWrite(path("a.md"), encode("original"));
        memory.failNextWrite();

        const failed = await save(notes, {
            text: "edited",
            baseText: "original",
        });
        expect(failed.ok).toBe(false);
        expect(await bytesOf(memory, "a.md")).toEqual([...encode("original")]);

        const readOnly = createInMemoryWorkspaceFileSystem({
            readOnly: true,
            state: memory.getState(),
        });
        const denied = await save(createNotes({ fs: readOnly }), {
            text: "edited",
            baseText: "original",
        });
        expect(denied.ok).toBe(false);
        if (!denied.ok) expect(denied.error.code).toBe("permission-denied");
        expect(await bytesOf(readOnly, "a.md")).toEqual([
            ...encode("original"),
        ]);
    });
});
