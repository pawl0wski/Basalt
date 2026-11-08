import {
    toWorkspacePath,
    type WorkspacePath,
    type WorkspaceRoot,
} from "@basalt/core";

export interface NativePaths {
    toNative(relative: string): string;
    toWorkspace(native: string): WorkspacePath | null;
    isRoot(native: string): boolean;
}

const WINDOWS_ROOT = /^[A-Za-z]:[\\/]|^\\\\/;

export function createNativePaths(root: WorkspaceRoot): NativePaths {
    const windows = WINDOWS_ROOT.test(root);
    const normalize = (path: string) =>
        windows ? path.replace(/\\/g, "/").toLowerCase() : path;
    const base = root.replace(windows ? /[\\/]+$/ : /\/+$/, "");
    const baseKey = normalize(base);

    return {
        toNative(relative) {
            const joined = relative === "" ? base : `${base}/${relative}`;
            return windows ? joined.replace(/\//g, "\\") : joined;
        },
        toWorkspace(native) {
            const key = normalize(native);
            if (!key.startsWith(`${baseKey}/`)) return null;
            const converted = windows ? native.replace(/\\/g, "/") : native;
            const result = toWorkspacePath(converted.slice(base.length + 1));
            return result.ok ? result.value : null;
        },
        isRoot(native) {
            return normalize(native).replace(/\/+$/, "") === baseKey;
        },
    };
}
