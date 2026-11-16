import { fileKindOf } from "./file-kinds";
import { err, ok, type Result } from "./result";
import type { FileEntry, FileKind, WorkspaceFileSystem } from "./ports";
import {
    pathKey,
    toWorkspacePath,
    validateNoteName,
    type WorkspacePath,
} from "./workspace-path";

export type Eol = "lf" | "crlf";

export interface Note {
    readonly path: WorkspacePath;
    readonly name: string;
}

export interface OpenedNote {
    readonly text: string;
    readonly eol: Eol;
    readonly bom: boolean;
}

export type SaveMode = "normal" | "overwrite" | "recreate";

export interface SaveNoteInput {
    readonly path: WorkspacePath;
    readonly text: string;
    readonly baseText: string;
    readonly eol: Eol;
    readonly bom: boolean;
    readonly mode?: SaveMode;
}

export interface NoteService {
    listNotes(): Promise<Result<readonly Note[]>>;
    openNote(path: WorkspacePath): Promise<Result<OpenedNote>>;
    suggestNoteName(existing: readonly Note[], baseName: string): string;
    createNote(name: string): Promise<Result<Note>>;
    saveNote(input: SaveNoteInput): Promise<Result<{ baseText: string }>>;
}

export const MAX_NOTE_BYTES = 5 * 1024 * 1024;

const EXTENSION = ".md";
const MARKDOWN_SUFFIX = /\.md$/i;
const BOM = "﻿";
const CRLF_COUNT = /\r\n/g;
const LONE_LF_COUNT = /(?<!\r)\n/g;

export function isMarkdownPath(path: string): boolean {
    return fileKindOf(path) === "markdown";
}

function isDotEntry(path: string): boolean {
    return path.split("/").some((segment) => segment.startsWith("."));
}

function toNote(entry: FileEntry): Note {
    const fileName = entry.path.slice(entry.path.lastIndexOf("/") + 1);
    return {
        path: entry.path,
        name: fileName.replace(MARKDOWN_SUFFIX, ""),
    };
}

function parseDiskText(raw: string): OpenedNote {
    const bom = raw.startsWith(BOM);
    const body = bom ? raw.slice(BOM.length) : raw;
    const crlf = body.match(CRLF_COUNT)?.length ?? 0;
    const lf = body.match(LONE_LF_COUNT)?.length ?? 0;
    return {
        text: body.replace(CRLF_COUNT, "\n"),
        eol: crlf > lf ? "crlf" : "lf",
        bom,
    };
}

function serialize(text: string, eol: Eol, bom: boolean): string {
    const body = eol === "crlf" ? text.replace(/\n/g, "\r\n") : text;
    return bom ? BOM + body : body;
}

function notRegularFile(kind: FileKind): Result<never> {
    if (kind === "directory") {
        return err({
            code: "not-a-file",
            message: "The path is a folder, not a note.",
        });
    }
    return err({
        code: "invalid-path",
        message: "The path is not a regular file.",
    });
}

export function createNotes({ fs }: { fs: WorkspaceFileSystem }): NoteService {
    async function listNotes(): Promise<Result<readonly Note[]>> {
        const listing = await fs.list();
        if (!listing.ok) return listing;
        return ok(
            listing.value
                .filter(
                    (entry) =>
                        entry.kind === "file" &&
                        isMarkdownPath(entry.path) &&
                        !isDotEntry(entry.path),
                )
                .map(toNote),
        );
    }

    async function openNote(path: WorkspacePath): Promise<Result<OpenedNote>> {
        const stat = await fs.stat(path);
        if (!stat.ok) return stat;
        if (stat.value.kind !== "file") return notRegularFile(stat.value.kind);
        if (stat.value.size > MAX_NOTE_BYTES) {
            return err({
                code: "too-large",
                message: "The note exceeds the size limit.",
            });
        }
        const raw = await fs.readText(path);
        if (!raw.ok) return raw;
        return ok(parseDiskText(raw.value));
    }

    function suggestNoteName(
        existing: readonly Note[],
        baseName: string,
    ): string {
        const taken = new Set(existing.map((note) => pathKey(note.path)));
        for (let index = 0; ; index += 1) {
            const candidate =
                index === 0 ? baseName : `${baseName} ${String(index)}`;
            const path = toWorkspacePath(candidate + EXTENSION);
            if (!path.ok || !taken.has(pathKey(path.value))) return candidate;
        }
    }

    async function createNote(name: string): Promise<Result<Note>> {
        const fileName = name + EXTENSION;
        const nameCheck = validateNoteName(name);
        const fileCheck = validateNoteName(fileName);
        if (!nameCheck.valid || !fileCheck.valid || name.startsWith(".")) {
            return err({
                code: "invalid-path",
                message: "The note name is not valid.",
            });
        }
        const path = toWorkspacePath(fileName);
        if (!path.ok) return path;
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const key = pathKey(path.value);
        if (listing.value.some((entry) => pathKey(entry.path) === key)) {
            return err({
                code: "already-exists",
                message: "An entry with this name already exists.",
            });
        }
        const created = await fs.createExclusive(path.value, "");
        if (!created.ok) return created;
        return ok({ path: path.value, name });
    }

    async function saveNote(
        input: SaveNoteInput,
    ): Promise<Result<{ baseText: string }>> {
        const { path, text, baseText, mode = "normal" } = input;
        let eol = input.eol;
        let bom = input.bom;
        const stat = await fs.stat(path);
        if (!stat.ok) {
            if (stat.error.code !== "not-found" || mode !== "recreate") {
                return stat;
            }
        } else {
            if (stat.value.kind !== "file") {
                return notRegularFile(stat.value.kind);
            }
            const raw = await fs.readText(path);
            if (!raw.ok) return raw;
            const disk = parseDiskText(raw.value);
            if (mode !== "overwrite" && disk.text !== baseText) {
                return err({
                    code: "conflict",
                    message: "The note changed on disk.",
                });
            }
            eol = disk.eol;
            bom = disk.bom;
        }
        const written = await fs.writeTextAtomic(
            path,
            serialize(text, eol, bom),
        );
        if (!written.ok) return written;
        return ok({ baseText: text });
    }

    return { listNotes, openNote, suggestNoteName, createNote, saveNote };
}
