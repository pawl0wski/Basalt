import {
    defaultAppSettings,
    err,
    ok,
    parseAppSettingsText,
    type Result,
    toWorkspacePath,
    type WorkspacePath,
    type WorkspaceRoot,
} from "@basalt/core";
import {
    createInMemoryWorkspaceFileSystem,
    type InMemoryState,
    type InMemoryWorkspaceFileSystem,
} from "@basalt/core/testing/in-memory";
import type { Platform } from "../platform";
import { createMemoryWindowChrome } from "./memory-window-chrome";
import { DEMO_WORKSPACE_FILES, DEMO_WORKSPACE_ROOT } from "./demo-workspace";
import type { BasaltTestFs } from "./test-fs";

export const WORKSPACES_KEY = "basalt.memory.workspaces";
export const SETTINGS_KEY = "basalt.memory.settings";

export interface MemoryPlatform {
    readonly platform: Platform;
    readonly testFs: BasaltTestFs;
}

function loadWorkspaces(storage: Storage): Map<string, InMemoryState> {
    try {
        const raw = storage.getItem(WORKSPACES_KEY);
        const parsed: unknown = raw === null ? {} : JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return new Map();
        return new Map(Object.entries(parsed) as [string, InMemoryState][]);
    } catch {
        return new Map();
    }
}

function path(value: string): WorkspacePath {
    const result = toWorkspacePath(value);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
}

export function createMemoryPlatform(storage: Storage): MemoryPlatform {
    const workspaces = loadWorkspaces(storage);
    const flags = { readOnly: false, failWatch: false };
    let pickerResult: string | null | undefined;
    let scopeDeniedPrefix: string | null = null;
    let current: { root: string; fs: InMemoryWorkspaceFileSystem } | null =
        null;

    function persist(): void {
        if (current) workspaces.set(current.root, current.fs.getState());
        try {
            storage.setItem(
                WORKSPACES_KEY,
                JSON.stringify(Object.fromEntries(workspaces)),
            );
        } catch {
            return;
        }
    }

    function seed(
        root: string,
        files: Readonly<Record<string, string | Uint8Array>>,
    ): void {
        const seeded = createInMemoryWorkspaceFileSystem();
        for (const [name, content] of Object.entries(files)) {
            seeded.externalWrite(
                path(name),
                typeof content === "string"
                    ? new TextEncoder().encode(content)
                    : content,
            );
        }
        workspaces.set(root, seeded.getState());
        persist();
    }

    function isDenied(target: string): boolean {
        const prefix = scopeDeniedPrefix;
        if (prefix === null) return false;
        return target === prefix || target.startsWith(`${prefix}/`);
    }

    function deniedResult(): Result<never> {
        return err({
            code: "scope-denied",
            message: "forbidden path: not allowed on the scope",
        });
    }

    function withScopeDenial(
        fs: InMemoryWorkspaceFileSystem,
    ): InMemoryWorkspaceFileSystem {
        return {
            ...fs,
            async stat(target) {
                return isDenied(target) ? deniedResult() : fs.stat(target);
            },
            async readText(target) {
                return isDenied(target) ? deniedResult() : fs.readText(target);
            },
            async readBytes(target) {
                return isDenied(target) ? deniedResult() : fs.readBytes(target);
            },
            async writeTextAtomic(target, text) {
                return isDenied(target)
                    ? deniedResult()
                    : fs.writeTextAtomic(target, text);
            },
            async createExclusive(target, content) {
                return isDenied(target)
                    ? deniedResult()
                    : fs.createExclusive(target, content);
            },
            async readDir(target) {
                return isDenied(target) ? deniedResult() : fs.readDir(target);
            },
            async mkdir(target) {
                return isDenied(target) ? deniedResult() : fs.mkdir(target);
            },
        };
    }

    function openFs(root: string, state: InMemoryState) {
        const fs = createInMemoryWorkspaceFileSystem({
            state,
            get readOnly() {
                return flags.readOnly;
            },
            get failWatch() {
                return flags.failWatch;
            },
        });
        const guarded: InMemoryWorkspaceFileSystem = {
            ...fs,
            async writeTextAtomic(target, text) {
                const result = await fs.writeTextAtomic(target, text);
                persist();
                return result;
            },
            async createExclusive(target, text) {
                const result = await fs.createExclusive(target, text);
                persist();
                return result;
            },
        };
        const scoped = withScopeDenial(guarded);
        current = { root, fs: scoped };
        return scoped;
    }

    function requireCurrent(): InMemoryWorkspaceFileSystem {
        if (!current) throw new Error("No workspace is open.");
        return current.fs;
    }

    const platform: Platform = {
        access: {
            async open(root: WorkspaceRoot) {
                const state = workspaces.get(root);
                if (!state) {
                    return err({
                        code: "not-found",
                        message: "No such workspace.",
                    });
                }
                try {
                    return ok(openFs(root, state));
                } catch {
                    return err({
                        code: "unknown",
                        message: "The stored workspace is corrupt.",
                    });
                }
            },
        },
        picker: {
            async pickDirectory() {
                scopeDeniedPrefix = null;
                if (pickerResult === undefined) {
                    if (!workspaces.has(DEMO_WORKSPACE_ROOT)) {
                        seed(DEMO_WORKSPACE_ROOT, DEMO_WORKSPACE_FILES);
                    }
                    return ok(DEMO_WORKSPACE_ROOT as WorkspaceRoot);
                }
                return ok(pickerResult as WorkspaceRoot | null);
            },
        },
        settings: {
            async load() {
                const raw = storage.getItem(SETTINGS_KEY);
                if (raw === null) return ok(defaultAppSettings());
                try {
                    return ok(parseAppSettingsText(raw));
                } catch {
                    return ok(defaultAppSettings());
                }
            },
            async save(settings) {
                storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
                return ok(undefined);
            },
        },
        windowChrome: createMemoryWindowChrome(),
    };

    const testFs: BasaltTestFs = {
        seedWorkspace(root, files) {
            seed(root, files);
        },
        setPickerResult(root) {
            pickerResult = root;
        },
        setReadOnly(readOnly) {
            flags.readOnly = readOnly;
        },
        setScopeDenied(prefix) {
            scopeDeniedPrefix = prefix;
        },
        setFailWatch(failWatch) {
            flags.failWatch = failWatch;
        },
        failNextWrite() {
            requireCurrent().failNextWrite();
        },
        listFiles() {
            return requireCurrent()
                .getState()
                .entries.filter((entry) => entry.kind === "file")
                .map((entry) => entry.path);
        },
        readBytes(target) {
            const entry = requireCurrent()
                .getState()
                .entries.find(
                    (candidate) =>
                        candidate.kind === "file" && candidate.path === target,
                );
            if (!entry || entry.kind !== "file") return null;
            return Uint8Array.from(atob(entry.base64), (char) =>
                char.charCodeAt(0),
            );
        },
        externalWrite(target, bytes) {
            requireCurrent().externalWrite(path(target), bytes);
            persist();
        },
        externalDelete(target) {
            requireCurrent().externalDelete(path(target));
            persist();
        },
        removeRoot() {
            const open = current;
            if (!open) throw new Error("No workspace is open.");
            open.fs.removeRoot();
            workspaces.delete(open.root);
            current = null;
            persist();
        },
    };

    return { platform, testFs };
}
