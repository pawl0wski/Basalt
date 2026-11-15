import { Channel } from "@tauri-apps/api/core";
import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";

type Entry =
    | { kind: "directory" }
    | { kind: "symlink" }
    | { kind: "file"; bytes: Uint8Array; mtimeMs: number };

type Invoke = (
    cmd: string,
    args?: unknown,
    options?: { headers?: Record<string, string> },
) => Promise<unknown>;

interface Watcher {
    readonly root: string;
    readonly channel: Channel<unknown>;
}

export interface FakePluginFs {
    readonly calls: string[];
    readonly entries: Map<string, Entry>;
    readonly configDir: string;
    readonly watchOptions: unknown[];
    seedFile(path: string, bytes: Uint8Array): void;
    seedText(path: string, text: string): void;
    seedSymlink(path: string): void;
    readBytes(path: string): number[] | undefined;
    externalWrite(path: string, bytes: Uint8Array): void;
    externalDelete(path: string): void;
    removeRoot(): void;
    failNext(command: string, message?: string): void;
    emitRaw(event: { type: unknown; paths: string[]; attrs?: unknown }): void;
    watcherCount(): number;
    pickDirectory(path: string | null): void;
    uninstall(): void;
}

const NOT_FOUND = "No such file or directory (os error 2)";

function parentOf(path: string): string {
    return path.slice(0, path.lastIndexOf("/"));
}

export function installFakePluginFs(
    root: string,
    configDir = "/home/user/.config/basalt",
): FakePluginFs {
    const entries = new Map<string, Entry>([[root, { kind: "directory" }]]);
    const watchers = new Map<number, Watcher>();
    const failures = new Map<string, string>();
    const calls: string[] = [];
    const watchOptions: unknown[] = [];
    let nextRid = 1;
    let clock = 1000;
    let picked: string | null = null;

    function guard(path: string): void {
        const inScope = [root, configDir].some(
            (base) => path === base || path.startsWith(`${base}/`),
        );
        if (!inScope) {
            throw `forbidden path: ${path}, maybe it is not allowed on the scope configuration`;
        }
    }

    function fire(command: string): void {
        calls.push(command);
        const message = failures.get(command);
        if (message !== undefined) {
            failures.delete(command);
            throw message;
        }
    }

    function emit(type: unknown, paths: string[]): void {
        for (const watcher of watchers.values()) {
            const relevant = paths.filter(
                (path) =>
                    path === watcher.root ||
                    path.startsWith(`${watcher.root}/`),
            );
            if (relevant.length > 0) {
                watcher.channel.onmessage({ type, paths: relevant, attrs: {} });
            }
        }
    }

    function requireParent(path: string): void {
        if (entries.get(parentOf(path))?.kind !== "directory") throw NOT_FOUND;
    }

    function store(path: string, bytes: Uint8Array): void {
        clock += 1;
        entries.set(path, { kind: "file", bytes, mtimeMs: clock });
    }

    function drop(path: string): void {
        for (const key of [...entries.keys()]) {
            if (key === path || key.startsWith(`${path}/`)) entries.delete(key);
        }
    }

    function info(entry: Entry) {
        return {
            isFile: entry.kind === "file",
            isDirectory: entry.kind === "directory",
            isSymlink: entry.kind === "symlink",
            size: entry.kind === "file" ? entry.bytes.length : 0,
            mtime: entry.kind === "file" ? entry.mtimeMs : null,
            atime: null,
            birthtime: null,
            readonly: false,
            fileAttributes: null,
            dev: null,
            ino: null,
            mode: null,
            nlink: null,
            uid: null,
            gid: null,
            rdev: null,
            blksize: null,
            blocks: null,
        };
    }

    const invoke: Invoke = async (cmd, args, options) => {
        const a = (args ?? {}) as Record<string, unknown>;
        switch (cmd) {
            case "plugin:path|resolve_directory":
                return configDir;
            case "plugin:path|join":
                return (a.paths as string[]).join("/");
            case "plugin:dialog|open":
                return picked;
            case "plugin:resources|close":
                watchers.delete(a.rid as number);
                return null;
            case "plugin:fs|read_file": {
                fire("read_file");
                const path = a.path as string;
                guard(path);
                const entry = entries.get(path);
                if (!entry) throw NOT_FOUND;
                if (entry.kind !== "file") throw "Is a directory (os error 21)";
                return entry.bytes.slice();
            }
            case "plugin:fs|write_file": {
                fire("write_file");
                const path = decodeURIComponent(options?.headers?.path ?? "");
                const flags = JSON.parse(options?.headers?.options ?? "{}") as {
                    createNew?: boolean;
                };
                guard(path);
                requireParent(path);
                if (flags.createNew && entries.has(path)) {
                    throw "File exists (os error 17)";
                }
                store(path, new Uint8Array(args as ArrayLike<number>));
                emit({ create: { kind: "file" } }, [path]);
                return null;
            }
            case "plugin:fs|rename": {
                fire("rename");
                const from = a.oldPath as string;
                const to = a.newPath as string;
                guard(from);
                guard(to);
                const entry = entries.get(from);
                if (!entry) throw NOT_FOUND;
                requireParent(to);
                entries.delete(from);
                entries.set(to, entry);
                emit({ modify: { kind: "rename", mode: "both" } }, [from, to]);
                return null;
            }
            case "plugin:fs|remove": {
                fire("remove");
                const path = a.path as string;
                guard(path);
                if (!entries.has(path)) throw NOT_FOUND;
                drop(path);
                emit({ remove: { kind: "any" } }, [path]);
                return null;
            }
            case "plugin:fs|stat":
            case "plugin:fs|lstat": {
                fire(cmd.slice("plugin:fs|".length));
                const path = a.path as string;
                guard(path);
                const entry = entries.get(path);
                if (!entry) throw NOT_FOUND;
                return info(entry);
            }
            case "plugin:fs|read_dir": {
                fire("read_dir");
                const path = a.path as string;
                guard(path);
                const dir = entries.get(path);
                if (!dir) throw NOT_FOUND;
                if (dir.kind !== "directory") {
                    throw "Not a directory (os error 20)";
                }
                return [...entries.entries()]
                    .filter(([key]) => parentOf(key) === path && key !== path)
                    .map(([key, entry]) => ({
                        name: key.slice(path.length + 1),
                        isDirectory: entry.kind === "directory",
                        isFile: entry.kind === "file",
                        isSymlink: entry.kind === "symlink",
                    }));
            }
            case "plugin:fs|mkdir": {
                fire("mkdir");
                const path = a.path as string;
                guard(path);
                const parts = path.slice(1).split("/");
                const created: string[] = [];
                for (let i = 1; i <= parts.length; i += 1) {
                    const dir = `/${parts.slice(0, i).join("/")}`;
                    const existing = entries.get(dir);
                    if (existing && existing.kind !== "directory") {
                        throw "File exists (os error 17)";
                    }
                    if (!existing) {
                        entries.set(dir, { kind: "directory" });
                        created.push(dir);
                    }
                }
                if (created.length > 0) {
                    emit({ create: { kind: "folder" } }, created);
                }
                return null;
            }
            case "plugin:fs|watch": {
                fire("watch");
                const paths = a.paths as string[];
                paths.forEach(guard);
                watchOptions.push(a.options);
                const rid = nextRid++;
                watchers.set(rid, {
                    root: paths[0],
                    channel: a.onEvent as Channel<unknown>,
                });
                return rid;
            }
            default:
                throw `unexpected command ${cmd}`;
        }
    };

    mockIPC(() => undefined);
    (
        window as unknown as { __TAURI_INTERNALS__: { invoke: Invoke } }
    ).__TAURI_INTERNALS__.invoke = invoke;

    return {
        calls,
        entries,
        configDir,
        watchOptions,
        seedFile(path, bytes) {
            for (
                let dir = parentOf(path);
                dir.length > 0 && !entries.has(dir);
                dir = parentOf(dir)
            ) {
                entries.set(dir, { kind: "directory" });
            }
            store(path, bytes);
        },
        seedText(path, text) {
            this.seedFile(path, new TextEncoder().encode(text));
        },
        seedSymlink(path) {
            entries.set(path, { kind: "symlink" });
        },
        readBytes(path) {
            const entry = entries.get(path);
            return entry?.kind === "file" ? Array.from(entry.bytes) : undefined;
        },
        externalWrite(path, bytes) {
            store(path, bytes);
            emit({ modify: { kind: "data", mode: "content" } }, [path]);
        },
        externalDelete(path) {
            drop(path);
            emit({ remove: { kind: "file" } }, [path]);
        },
        removeRoot() {
            drop(root);
            emit({ remove: { kind: "folder" } }, [root]);
        },
        failNext(command, message = "No space left on device (os error 28)") {
            failures.set(command, message);
        },
        emitRaw(event) {
            for (const watcher of watchers.values()) {
                watcher.channel.onmessage({ attrs: {}, ...event });
            }
        },
        watcherCount: () => watchers.size,
        pickDirectory(path) {
            picked = path;
        },
        uninstall() {
            clearMocks();
        },
    };
}
