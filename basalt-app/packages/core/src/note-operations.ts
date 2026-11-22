import { rewriteLinksTo, rewriteRelativeLinks } from "./link-rewrite";
import { setFirstHeading } from "./note-heading";
import { HIDDEN_ROOT_FOLDERS } from "./tree";
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

export interface RenameFolderInput {
    readonly path: WorkspacePath;
    readonly newName: string;
}

export interface MoveFolderInput {
    readonly path: WorkspacePath;
    readonly destinationFolder: WorkspacePath | null;
}

export interface FolderMove {
    readonly from: WorkspacePath;
    readonly to: WorkspacePath;
}

export interface NoteOperations {
    renameFolder(
        input: RenameFolderInput,
    ): Promise<Result<{ path: WorkspacePath }>>;
    moveFolder(
        input: MoveFolderInput,
    ): Promise<Result<{ moved: FolderMove | null }>>;
    deleteFolder(input: {
        readonly path: WorkspacePath;
    }): Promise<Result<{ path: WorkspacePath }>>;
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

function isHiddenRoot(path: string): boolean {
    const first = path.split("/")[0] ?? "";
    return HIDDEN_ROOT_FOLDERS.some(
        (hidden) =>
            pathKey(hidden as WorkspacePath) ===
            pathKey(first as WorkspacePath),
    );
}

function isReservedRootName(parent: string | null, name: string): boolean {
    return parent === null && isHiddenRoot(name);
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

    function findFolder(
        listing: readonly FileEntry[],
        path: WorkspacePath,
    ): Result<FileEntry> {
        const entry = listing.find((candidate) => candidate.path === path);
        if (!entry) return failure("not-found", "The folder was not found.");
        if (
            entry.kind !== "directory" ||
            isDotEntry(path) ||
            isHiddenRoot(path)
        ) {
            return failure("invalid-path", "The path is not a folder.");
        }
        return ok(entry);
    }

    async function renameFolder(
        input: RenameFolderInput,
    ): Promise<Result<{ path: WorkspacePath }>> {
        const { path, newName } = input;
        const parent = directoryOf(path);
        if (
            !validateNoteName(newName).valid ||
            newName.startsWith(".") ||
            isReservedRootName(parent === "" ? null : parent, newName)
        ) {
            return failure("invalid-path", "The folder name is not valid.");
        }
        const target = pathOf(parent + newName);
        if (!target.ok) return target;
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const source = findFolder(listing.value, path);
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

    async function moveFolder(
        input: MoveFolderInput,
    ): Promise<Result<{ moved: FolderMove | null }>> {
        const { path, destinationFolder } = input;
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const source = findFolder(listing.value, path);
        if (!source.ok) return source;
        if (destinationFolder !== null) {
            const folder = findFolder(listing.value, destinationFolder);
            if (!folder.ok) return folder;
            if (
                destinationFolder === path ||
                destinationFolder.startsWith(`${path}/`)
            ) {
                return failure(
                    "invalid-path",
                    "A folder cannot be moved into itself.",
                );
            }
        }
        const prefix =
            destinationFolder === null ? "" : `${destinationFolder}/`;
        if (directoryOf(path) === prefix) return ok({ moved: null });
        const name = baseNameOf(path);
        if (isReservedRootName(destinationFolder, name)) {
            return failure("invalid-path", "The folder name is not valid.");
        }
        const target = pathOf(prefix + name);
        if (!target.ok) return target;
        const key = pathKey(target.value);
        if (listing.value.some((entry) => pathKey(entry.path) === key)) {
            return failure(
                "already-exists",
                `"${name}" already exists in the destination.`,
                { kind: "move-collision", name },
            );
        }
        const renamed = await fs.rename(path, target.value);
        if (!renamed.ok) return renamed;
        const move: FolderMove = { from: path, to: target.value };
        const remap = (candidate: WorkspacePath): WorkspacePath =>
            candidate === move.from || candidate.startsWith(`${move.from}/`)
                ? ((move.to +
                      candidate.slice(move.from.length)) as WorkspacePath)
                : candidate;
        const notes = listing.value.filter(
            (entry) =>
                entry.kind === "file" &&
                isMarkdownPath(entry.path) &&
                entry.path.startsWith(`${path}/`) &&
                !isDotEntry(entry.path),
        );
        let rewrittenCount = 0;
        for (const note of notes) {
            const moved = remap(note.path);
            const raw = await fs.readText(moved);
            const written = raw.ok
                ? await rewriteMovedNote(moved, note.path, raw.value, remap)
                : raw;
            if (!written.ok) {
                return err({
                    code: written.error.code,
                    message: `"${name}" was moved but links in its notes could not be updated: ${written.error.message}`,
                    detail: {
                        kind: "folder-move-stopped",
                        name,
                        moved: rewrittenCount,
                        total: notes.length,
                    },
                } as AppError);
            }
            rewrittenCount += 1;
        }
        return ok({ moved: move });
    }

    async function rewriteMovedNote(
        moved: WorkspacePath,
        original: WorkspacePath,
        raw: string,
        remap: (target: WorkspacePath) => WorkspacePath,
    ): Promise<Result<void>> {
        const bom = raw.startsWith(BOM);
        const body = bom ? raw.slice(BOM.length) : raw;
        const rewritten = rewriteRelativeLinks(body, original, moved, remap);
        if (rewritten === body) return ok(undefined);
        return fs.writeTextAtomic(moved, bom ? BOM + rewritten : rewritten);
    }

    async function deleteFolder(input: {
        readonly path: WorkspacePath;
    }): Promise<Result<{ path: WorkspacePath }>> {
        const listing = await fs.list();
        if (!listing.ok) return listing;
        const source = findFolder(listing.value, input.path);
        if (!source.ok) return source;
        const moved = await trash.moveToTrash([input.path]);
        if (!moved.ok) return moved;
        return ok({ path: input.path });
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
        if (
            !validateNoteName(name).valid ||
            name.startsWith(".") ||
            isReservedRootName(parent, name)
        ) {
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
        renameFolder,
        moveFolder,
        deleteFolder,
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
