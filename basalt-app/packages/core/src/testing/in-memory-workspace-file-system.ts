import { err, ok, type Result } from "../result";
import type {
    FileEntry,
    FileStat,
    Unwatch,
    WatchEvent,
    WorkspaceFileSystem,
} from "../ports";
import { toWorkspacePath, type WorkspacePath } from "../workspace-path";

export type InMemoryStateEntry =
    | { readonly path: string; readonly kind: "directory" }
    | { readonly path: string; readonly kind: "symlink" }
    | {
          readonly path: string;
          readonly kind: "file";
          readonly base64: string;
          readonly mtimeMs: number;
      };

export interface InMemoryState {
    readonly entries: readonly InMemoryStateEntry[];
}

export interface InMemoryWorkspaceFileSystemOptions {
    readonly readOnly?: boolean;
    readonly failWatch?: boolean;
    readonly state?: InMemoryState;
}

export interface InMemoryWorkspaceFileSystem extends WorkspaceFileSystem {
    externalWrite(path: WorkspacePath, bytes: Uint8Array): void;
    externalDelete(path: WorkspacePath): void;
    addSymlink(path: WorkspacePath): void;
    removeRoot(): void;
    failNextWrite(): void;
    getState(): InMemoryState;
}

type StoredEntry =
    | { kind: "directory" }
    | { kind: "symlink" }
    | { kind: "file"; bytes: Uint8Array; mtimeMs: number };

const ROOT_REMOVED = "The workspace root no longer exists.";

function asPath(path: string): WorkspacePath {
    const result = toWorkspacePath(path);
    if (!result.ok) throw new Error(`Invalid workspace path: ${path}`);
    return result.value;
}

function ancestors(path: string): string[] {
    const segments = path.split("/");
    return segments
        .slice(0, -1)
        .map((_, index) => segments.slice(0, index + 1).join("/"));
}

function toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export function createInMemoryWorkspaceFileSystem(
    options: InMemoryWorkspaceFileSystemOptions = {},
): InMemoryWorkspaceFileSystem {
    const entries = new Map<string, StoredEntry>();
    const listeners = new Set<(event: WatchEvent) => void>();
    let clock = 0;
    let rootRemoved = false;
    let writeShouldFail = false;

    for (const entry of options.state?.entries ?? []) {
        asPath(entry.path);
        if (entry.kind === "file") {
            entries.set(entry.path, {
                kind: "file",
                bytes: fromBase64(entry.base64),
                mtimeMs: entry.mtimeMs,
            });
            clock = Math.max(clock, entry.mtimeMs);
        } else {
            entries.set(entry.path, { kind: entry.kind });
        }
    }

    function emit(event: WatchEvent): void {
        for (const listener of [...listeners]) listener(event);
    }

    function ensureParents(path: string): void {
        for (const ancestor of ancestors(path)) {
            if (!entries.has(ancestor)) {
                entries.set(ancestor, { kind: "directory" });
            }
        }
    }

    function store(path: string, bytes: Uint8Array): void {
        ensureParents(path);
        clock += 1;
        entries.set(path, { kind: "file", bytes, mtimeMs: clock });
    }

    function rootGuard(): Result<never> | null {
        return rootRemoved
            ? err({ code: "unavailable", message: ROOT_REMOVED })
            : null;
    }

    function writeGuard(path: string): Result<never> | null {
        const removed = rootGuard();
        if (removed) return removed;
        if (options.readOnly) {
            return err({
                code: "permission-denied",
                message: "The workspace is read-only.",
            });
        }
        if (writeShouldFail) {
            writeShouldFail = false;
            return err({ code: "unknown", message: "Injected write failure." });
        }
        const blocking = [path, ...ancestors(path)].find((candidate) => {
            const existing = entries.get(candidate);
            return (
                existing &&
                (candidate === path
                    ? existing.kind !== "file"
                    : existing.kind !== "directory")
            );
        });
        return blocking
            ? err({
                  code: "invalid-path",
                  message: "The path is blocked by a non-file entry.",
              })
            : null;
    }

    function removeEntry(path: string): void {
        for (const key of [...entries.keys()]) {
            if (key === path || key.startsWith(`${path}/`)) {
                entries.delete(key);
            }
        }
    }

    return {
        async list() {
            const removed = rootGuard();
            if (removed) return removed;
            const listing: FileEntry[] = [...entries.entries()]
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([path, entry]) => ({
                    path: asPath(path),
                    kind: entry.kind,
                }));
            return ok(listing);
        },

        async stat(path) {
            const removed = rootGuard();
            if (removed) return removed;
            const entry = entries.get(path);
            if (!entry) {
                return err({ code: "not-found", message: "No such entry." });
            }
            const stat: FileStat =
                entry.kind === "file"
                    ? {
                          kind: "file",
                          size: entry.bytes.length,
                          mtimeMs: entry.mtimeMs,
                      }
                    : { kind: entry.kind, size: 0, mtimeMs: 0 };
            return ok(stat);
        },

        async readText(path) {
            const removed = rootGuard();
            if (removed) return removed;
            const entry = entries.get(path);
            if (!entry) {
                return err({ code: "not-found", message: "No such file." });
            }
            if (entry.kind !== "file") {
                return err({
                    code: "invalid-path",
                    message: "The entry is not a regular file.",
                });
            }
            try {
                return ok(
                    new TextDecoder("utf-8", {
                        fatal: true,
                        ignoreBOM: true,
                    }).decode(entry.bytes),
                );
            } catch {
                return err({
                    code: "not-utf8",
                    message: "The file is not valid UTF-8.",
                });
            }
        },

        async readBytes(path) {
            const removed = rootGuard();
            if (removed) return removed;
            const entry = entries.get(path);
            if (!entry) {
                return err({ code: "not-found", message: "No such file." });
            }
            if (entry.kind !== "file") {
                return err({
                    code: "invalid-path",
                    message: "The entry is not a regular file.",
                });
            }
            return ok(entry.bytes.slice());
        },

        async writeTextAtomic(path, text) {
            const blocked = writeGuard(path);
            if (blocked) return blocked;
            store(path, new TextEncoder().encode(text));
            emit({ kind: "changed", paths: [path] });
            return ok(undefined);
        },

        async createExclusive(path, content) {
            const removed = rootGuard();
            if (removed) return removed;
            if (!options.readOnly && entries.has(path)) {
                return err({
                    code: "already-exists",
                    message: "The entry already exists.",
                });
            }
            const blocked = writeGuard(path);
            if (blocked) return blocked;
            store(
                path,
                typeof content === "string"
                    ? new TextEncoder().encode(content)
                    : content.slice(),
            );
            emit({ kind: "changed", paths: [path] });
            return ok(undefined);
        },

        async readDir(path) {
            const removed = rootGuard();
            if (removed) return removed;
            const entry = entries.get(path);
            if (!entry) {
                return err({ code: "not-found", message: "No such folder." });
            }
            if (entry.kind !== "directory") {
                return err({
                    code: "invalid-path",
                    message: "The entry is not a folder.",
                });
            }
            const children: FileEntry[] = [...entries.entries()]
                .filter(
                    ([key]) =>
                        key.startsWith(`${path}/`) &&
                        !key.slice(path.length + 1).includes("/"),
                )
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([key, child]) => ({
                    path: asPath(key),
                    kind: child.kind,
                }));
            return ok(children);
        },

        async mkdir(path) {
            const removed = rootGuard();
            if (removed) return removed;
            if (options.readOnly) {
                return err({
                    code: "permission-denied",
                    message: "The workspace is read-only.",
                });
            }
            const existing = entries.get(path);
            if (existing?.kind === "directory") return ok(undefined);
            if (existing) {
                return err({
                    code: "already-exists",
                    message: "A file is in the way.",
                });
            }
            const blocked = ancestors(path).find(
                (ancestor) =>
                    entries.has(ancestor) &&
                    entries.get(ancestor)?.kind !== "directory",
            );
            if (blocked) {
                return err({
                    code: "invalid-path",
                    message: "The path is blocked by a non-folder entry.",
                });
            }
            ensureParents(path);
            entries.set(path, { kind: "directory" });
            emit({ kind: "changed", paths: [path] });
            return ok(undefined);
        },

        async watch(onEvent) {
            const removed = rootGuard();
            if (removed) return removed;
            if (options.failWatch) {
                return err({
                    code: "unavailable",
                    message: "Watching could not start.",
                });
            }
            listeners.add(onEvent);
            const unwatch: Unwatch = async () => {
                listeners.delete(onEvent);
            };
            return ok(unwatch);
        },

        externalWrite(path, bytes) {
            store(path, bytes.slice());
            emit({ kind: "changed", paths: [path] });
        },

        externalDelete(path) {
            removeEntry(path);
            emit({ kind: "changed", paths: [path] });
        },

        addSymlink(path) {
            ensureParents(path);
            entries.set(path, { kind: "symlink" });
        },

        removeRoot() {
            rootRemoved = true;
            entries.clear();
            emit({ kind: "root-lost" });
        },

        failNextWrite() {
            writeShouldFail = true;
        },

        getState() {
            return {
                entries: [...entries.entries()].map(([path, entry]) =>
                    entry.kind === "file"
                        ? {
                              path,
                              kind: "file",
                              base64: toBase64(entry.bytes),
                              mtimeMs: entry.mtimeMs,
                          }
                        : { path, kind: entry.kind },
                ),
            };
        },
    };
}
