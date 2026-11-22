import { rewriteLinksTo, rewriteRelativeLinks } from "./link-rewrite";
import { setFirstHeading } from "./note-heading";
import { isMarkdownPath } from "./notes";
import type { FileEntry, WorkspaceFileSystem, WorkspaceTrash } from "./ports";
import {
    err,
    ok,
    type AppError,
    type AppErrorDetail,
    type Result,
} from "./result";
import {
    pathKey,
    toWorkspacePath,
    validateNoteName,
    type WorkspacePath,
} from "./workspace-path";

const EXTENSION = ".md";
const BOM = "﻿";

export interface RenameNoteInput {
    readonly path: WorkspacePath;
    readonly newName: string;
}

export interface NoteMove {
    readonly from: WorkspacePath;
    readonly to: WorkspacePath;
}

export interface MoveNotesInput {
    readonly paths: readonly WorkspacePath[];
    readonly destinationFolder: WorkspacePath | null;
    readonly onMoved?: (move: NoteMove) => void;
}

export interface CreateFolderInput {
    readonly parent: WorkspacePath | null;
    readonly name: string;
}

export interface DeleteNotesInput {
    readonly paths: readonly WorkspacePath[];
}

export interface NoteDeleteFailure {
    readonly path: WorkspacePath;
    readonly error: AppError;
}

export interface DeleteNotesResult {
    readonly deleted: readonly WorkspacePath[];
    readonly failed: readonly NoteDeleteFailure[];
}

export interface RenameByTitleInput {
    readonly path: WorkspacePath;
    readonly title: string;
}

export interface RewriteIncomingLinksInput {
    readonly oldPath: WorkspacePath;
    readonly newPath: WorkspacePath;
    readonly skip: readonly WorkspacePath[];
}

export interface RewriteIncomingLinksResult {
    readonly changed: readonly WorkspacePath[];
    readonly failed: readonly NoteDeleteFailure[];
}

export interface NoteOperations {
    renameNoteByTitle(
        input: RenameByTitleInput,
    ): Promise<Result<{ path: WorkspacePath }>>;
    rewriteIncomingLinks(
        input: RewriteIncomingLinksInput,
    ): Promise<Result<RewriteIncomingLinksResult>>;
    createFolder(
        input: CreateFolderInput,
    ): Promise<Result<{ path: WorkspacePath }>>;
    renameNote(
        input: RenameNoteInput,
    ): Promise<Result<{ path: WorkspacePath }>>;
    moveNotes(
        input: MoveNotesInput,
    ): Promise<Result<{ moved: readonly NoteMove[] }>>;
    deleteNotes(input: DeleteNotesInput): Promise<Result<DeleteNotesResult>>;
}

function directoryOf(path: string): string {
    return path.slice(0, path.lastIndexOf("/") + 1);
}

function baseNameOf(path: string): string {
    return path.slice(path.lastIndexOf("/") + 1);
}

function isDotEntry(path: string): boolean {
    return path.split("/").some((segment) => segment.startsWith("."));
}

function failure(
    code: AppError["code"],
    message: string,
    detail?: AppErrorDetail,
): Result<never> {
    return err({ code, message, detail } as AppError);
}

function pathOf(value: string): Result<WorkspacePath> {
    return toWorkspacePath(value);
}

function findNote(
    listing: readonly FileEntry[],
    path: WorkspacePath,
): Result<FileEntry> {
    const entry = listing.find((candidate) => candidate.path === path);
    if (!entry) return failure("not-found", "The note was not found.");
    if (entry.kind !== "file" || !isMarkdownPath(path)) {
        return failure("invalid-path", "The path is not a note.");
    }
    return ok(entry);
}

export function createNoteOperations({
    fs,
    trash,
}: {
    fs: WorkspaceFileSystem;
    trash: WorkspaceTrash;
}): NoteOperations {
    async function renameNote(
        input: RenameNoteInput,
    ): Promise<Result<{ path: WorkspacePath }>> {
        const { path, newName } = input;
        const fileName = newName + EXTENSION;
        if (
            !validateNoteName(newName).valid ||
            !validateNoteName(fileName).valid ||
            newName.startsWith(".")
        ) {
            return failure("invalid-path", "The note name is not valid.");
        }
        const target = pathOf(directoryOf(path) + fileName);
        if (!target.ok) return target;
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const source = findNote(listing.value, path);
        if (!source.ok) return source;
        if (target.value === path) return ok({ path });
        const key = pathKey(target.value);
        const collides = listing.value.some(
            (entry) => entry.path !== path && pathKey(entry.path) === key,
        );
        if (collides) {
            return failure(
                "already-exists",
                "An entry with this name already exists.",
            );
        }
        const renamed = await fs.rename(path, target.value);
        if (!renamed.ok) return renamed;
        return ok({ path: target.value });
    }

    async function renameNoteByTitle(
        input: RenameByTitleInput,
    ): Promise<Result<{ path: WorkspacePath }>> {
        const { path, title } = input;
        const fileName = title + EXTENSION;
        if (
            !validateNoteName(title).valid ||
            !validateNoteName(fileName).valid ||
            title.startsWith(".")
        ) {
            return failure("invalid-path", "The note name is not valid.");
        }
        const target = pathOf(directoryOf(path) + fileName);
        if (!target.ok) return target;
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const source = findNote(listing.value, path);
        if (!source.ok) return source;
        const key = pathKey(target.value);
        const collides = listing.value.some(
            (entry) => entry.path !== path && pathKey(entry.path) === key,
        );
        if (collides) {
            return failure(
                "already-exists",
                "An entry with this name already exists.",
            );
        }
        const raw = await fs.readText(path);
        if (!raw.ok) return raw;
        const bom = raw.value.startsWith(BOM);
        const body = bom ? raw.value.slice(BOM.length) : raw.value;
        const titled = setFirstHeading(body, title);
        const rewritten = rewriteLinksTo(titled, path, path, target.value);
        if (rewritten !== body) {
            const written = await fs.writeTextAtomic(
                path,
                bom ? BOM + rewritten : rewritten,
            );
            if (!written.ok) return written;
        }
        if (target.value === path) return ok({ path });
        const renamed = await fs.rename(path, target.value);
        if (!renamed.ok) return renamed;
        return ok({ path: target.value });
    }

    async function rewriteIncomingLinks(
        input: RewriteIncomingLinksInput,
    ): Promise<Result<RewriteIncomingLinksResult>> {
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const skipped = new Set<WorkspacePath>([
            ...input.skip,
            input.oldPath,
            input.newPath,
        ]);
        const changed: WorkspacePath[] = [];
        const failed: NoteDeleteFailure[] = [];
        for (const entry of listing.value) {
            if (
                entry.kind !== "file" ||
                !isMarkdownPath(entry.path) ||
                isDotEntry(entry.path) ||
                skipped.has(entry.path)
            ) {
                continue;
            }
            const raw = await fs.readText(entry.path);
            if (!raw.ok) {
                failed.push({ path: entry.path, error: raw.error });
                continue;
            }
            const bom = raw.value.startsWith(BOM);
            const body = bom ? raw.value.slice(BOM.length) : raw.value;
            const rewritten = rewriteLinksTo(
                body,
                entry.path,
                input.oldPath,
                input.newPath,
            );
            if (rewritten === body) continue;
            const written = await fs.writeTextAtomic(
                entry.path,
                bom ? BOM + rewritten : rewritten,
            );
            if (written.ok) changed.push(entry.path);
            else failed.push({ path: entry.path, error: written.error });
        }
        return ok({ changed, failed });
    }

    async function rewriteLinks(move: NoteMove): Promise<Result<void>> {
        const raw = await fs.readText(move.to);
        if (!raw.ok) return raw;
        const bom = raw.value.startsWith(BOM);
        const body = bom ? raw.value.slice(BOM.length) : raw.value;
        const rewritten = rewriteRelativeLinks(body, move.from, move.to);
        if (rewritten === body) return ok(undefined);
        return fs.writeTextAtomic(move.to, bom ? BOM + rewritten : rewritten);
    }

    function plan(
        listing: readonly FileEntry[],
        input: MoveNotesInput,
    ): Result<NoteMove[]> {
        const destination = input.destinationFolder;
        if (destination !== null) {
            const folder = listing.find((entry) => entry.path === destination);
            if (!folder) {
                return failure(
                    "not-found",
                    "The destination folder was not found.",
                );
            }
            if (folder.kind !== "directory" || isDotEntry(destination)) {
                return failure(
                    "invalid-path",
                    "The destination is not a folder.",
                );
            }
        }
        const prefix = destination === null ? "" : `${destination}/`;
        const taken = new Set(listing.map((entry) => pathKey(entry.path)));
        const moves: NoteMove[] = [];
        for (const path of new Set(input.paths)) {
            const source = findNote(listing, path);
            if (!source.ok) return source;
            if (directoryOf(path) === prefix) continue;
            const target = pathOf(prefix + baseNameOf(path));
            if (!target.ok) return target;
            const key = pathKey(target.value);
            if (taken.has(key)) {
                return failure(
                    "already-exists",
                    `"${baseNameOf(path)}" already exists in the destination.`,
                    { kind: "move-collision", name: baseNameOf(path) },
                );
            }
            taken.add(key);
            moves.push({ from: path, to: target.value });
        }
        return ok(moves);
    }

    async function moveNotes(
        input: MoveNotesInput,
    ): Promise<Result<{ moved: readonly NoteMove[] }>> {
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const planned = plan(listing.value, input);
        if (!planned.ok) return planned;
        const moved: NoteMove[] = [];
        for (const move of planned.value) {
            const renamed = await fs.rename(move.from, move.to);
            if (!renamed.ok) {
                return stopped(
                    renamed.error,
                    moved.length,
                    planned.value.length,
                    move,
                    false,
                );
            }
            moved.push(move);
            input.onMoved?.(move);
            const rewritten = await rewriteLinks(move);
            if (!rewritten.ok) {
                return stopped(
                    rewritten.error,
                    moved.length,
                    planned.value.length,
                    move,
                    true,
                );
            }
        }
        return ok({ moved });
    }

    async function createFolder(
        input: CreateFolderInput,
    ): Promise<Result<{ path: WorkspacePath }>> {
        const { parent, name } = input;
        if (!validateNoteName(name).valid || name.startsWith(".")) {
            return failure("invalid-path", "The folder name is not valid.");
        }
        const target = pathOf((parent === null ? "" : `${parent}/`) + name);
        if (!target.ok) return target;
        const listing = await fs.list();
        if (!listing.ok) return listing;
        if (parent !== null) {
            const folder = listing.value.find((entry) => entry.path === parent);
            if (!folder) {
                return failure("not-found", "The folder was not found.");
            }
            if (folder.kind !== "directory" || isDotEntry(parent)) {
                return failure("invalid-path", "The parent is not a folder.");
            }
        }
        const key = pathKey(target.value);
        if (listing.value.some((entry) => pathKey(entry.path) === key)) {
            return failure(
                "already-exists",
                "An entry with this name already exists.",
            );
        }
        const created = await fs.mkdir(target.value);
        if (!created.ok) return created;
        return ok({ path: target.value });
    }

    async function deleteNotes(
        input: DeleteNotesInput,
    ): Promise<Result<DeleteNotesResult>> {
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const deleted: WorkspacePath[] = [];
        const failed: NoteDeleteFailure[] = [];
        for (const path of new Set(input.paths)) {
            const source = findNote(listing.value, path);
            if (!source.ok) {
                failed.push({ path, error: source.error });
                continue;
            }
            const moved = await trash.moveToTrash([path]);
            if (moved.ok) deleted.push(path);
            else failed.push({ path, error: moved.error });
        }
        return ok({ deleted, failed });
    }

    return {
        renameNote,
        renameNoteByTitle,
        rewriteIncomingLinks,
        moveNotes,
        createFolder,
        deleteNotes,
    };
}

function stopped(
    error: AppError,
    movedCount: number,
    total: number,
    move: NoteMove,
    linksOnly: boolean,
): Result<never> {
    if (!linksOnly && movedCount === 0) return err(error);
    const name = baseNameOf(move.from);
    const progress = `Moved ${String(movedCount)} of ${String(total)} notes.`;
    const detail = linksOnly
        ? `"${name}" was moved but its links could not be updated`
        : `"${name}" could not be moved`;
    return err({
        code: error.code,
        message: `${progress} ${detail}: ${error.message}`,
        detail: {
            kind: "move-stopped",
            name,
            moved: movedCount,
            total,
            linksOnly,
        },
    } as AppError);
}
