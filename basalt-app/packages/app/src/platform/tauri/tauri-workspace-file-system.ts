import {
    err,
    ok,
    type FileEntry,
    type FileKind,
    type Result,
    type WorkspaceFileSystem,
    type WorkspacePath,
    type WorkspaceRoot,
} from "@basalt/core";
import {
    lstat,
    mkdir,
    readDir,
    readFile,
    remove,
    watch,
    writeFile,
    type FileInfo,
    type WatchEvent as PluginWatchEvent,
} from "@tauri-apps/plugin-fs";
import { writeFileAtomic } from "./atomic-write";
import { createNativePaths } from "./native-paths";
import { attempt } from "./plugin-errors";

const WATCH_DEBOUNCE_MS = 300;

function kindOf(entry: { isDirectory: boolean; isSymlink: boolean }): FileKind {
    if (entry.isSymlink) return "symlink";
    return entry.isDirectory ? "directory" : "file";
}

function isAccessEvent(event: PluginWatchEvent): boolean {
    return typeof event.type === "object" && "access" in event.type;
}

export function createTauriWorkspaceFileSystem(
    root: WorkspaceRoot,
): WorkspaceFileSystem {
    const paths = createNativePaths(root);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

    async function collect(
        directory: string,
        entries: FileEntry[],
    ): Promise<Result<void>> {
        const listed = await attempt(() => readDir(paths.toNative(directory)));
        if (!listed.ok) {
            return directory !== "" && listed.error.code === "not-found"
                ? ok(undefined)
                : err(listed.error);
        }
        for (const dirent of listed.value) {
            const relative =
                directory === "" ? dirent.name : `${directory}/${dirent.name}`;
            const path = paths.toWorkspace(paths.toNative(relative));
            if (path === null) continue;
            const kind = kindOf(dirent);
            entries.push({ path, kind });
            if (kind === "directory") {
                const nested = await collect(relative, entries);
                if (!nested.ok) return nested;
            }
        }
        return ok(undefined);
    }

    async function ensureParent(relative: string): Promise<Result<void>> {
        const slash = relative.lastIndexOf("/");
        if (slash < 0) return ok(undefined);
        return attempt(() =>
            mkdir(paths.toNative(relative.slice(0, slash)), {
                recursive: true,
            }),
        );
    }

    async function rootIsMissing(): Promise<boolean> {
        const stat = await attempt(() => lstat(paths.toNative("")));
        return !stat.ok && stat.error.code === "not-found";
    }

    return {
        async list() {
            const entries: FileEntry[] = [];
            const collected = await collect("", entries);
            return collected.ok ? ok(entries) : collected;
        },

        async stat(path) {
            const info = await attempt<FileInfo>(() =>
                lstat(paths.toNative(path)),
            );
            if (!info.ok) return info;
            return ok({
                kind: kindOf(info.value),
                size: info.value.size,
                mtimeMs: info.value.mtime?.getTime() ?? 0,
            });
        },

        async readText(path) {
            const bytes = await attempt(() => readFile(paths.toNative(path)));
            if (!bytes.ok) return bytes;
            try {
                return ok(decoder.decode(bytes.value));
            } catch {
                return err({
                    code: "not-utf8",
                    message: "The file is not valid UTF-8.",
                });
            }
        },

        async readBytes(path) {
            const bytes = await attempt(() => readFile(paths.toNative(path)));
            return bytes.ok ? ok(bytes.value) : bytes;
        },

        async writeTextAtomic(path, text) {
            const parent = await ensureParent(path);
            if (!parent.ok) return parent;
            const slash = path.lastIndexOf("/") + 1;
            const temp = `${path.slice(0, slash)}.${path.slice(slash)}.basalt-tmp`;
            return writeFileAtomic(
                paths.toNative(path),
                paths.toNative(temp),
                encoder.encode(text),
            );
        },

        async createExclusive(path, content) {
            const parent = await ensureParent(path);
            if (!parent.ok) return parent;
            const native = paths.toNative(path);
            const existed = (await attempt(() => lstat(native))).ok;
            const written = await attempt(() =>
                writeFile(
                    native,
                    typeof content === "string"
                        ? encoder.encode(content)
                        : content,
                    { createNew: true },
                ),
            );
            if (!written.ok && written.error.code === "unknown" && !existed) {
                await attempt(() => remove(native));
            }
            return written;
        },

        async readDir(path) {
            const listed = await attempt(() => readDir(paths.toNative(path)));
            if (!listed.ok) return listed;
            const entries: FileEntry[] = [];
            for (const dirent of listed.value) {
                const child = paths.toWorkspace(
                    paths.toNative(`${path}/${dirent.name}`),
                );
                if (child !== null) {
                    entries.push({ path: child, kind: kindOf(dirent) });
                }
            }
            return ok(entries);
        },

        async mkdir(path) {
            return attempt(() =>
                mkdir(paths.toNative(path), { recursive: true }),
            );
        },

        async watch(onEvent) {
            let active = true;

            async function dispatch(event: PluginWatchEvent): Promise<void> {
                if (isAccessEvent(event)) return;
                const changed = new Set<WorkspacePath>();
                let rootTouched = false;
                for (const native of event.paths) {
                    if (paths.isRoot(native)) {
                        rootTouched = true;
                        continue;
                    }
                    const path = paths.toWorkspace(native);
                    if (path !== null) changed.add(path);
                }
                if (changed.size > 0) {
                    onEvent({ kind: "changed", paths: [...changed] });
                }
                if (rootTouched && (await rootIsMissing()) && active) {
                    onEvent({ kind: "root-lost" });
                }
            }

            const started = await attempt(() =>
                watch(
                    root,
                    (event) => {
                        if (active) void dispatch(event);
                    },
                    { recursive: true, delayMs: WATCH_DEBOUNCE_MS },
                ),
            );
            if (!started.ok) {
                return err({
                    code: "unavailable",
                    message: "Watching the workspace could not start.",
                });
            }
            return ok(async () => {
                active = false;
                started.value();
            });
        },
    };
}
