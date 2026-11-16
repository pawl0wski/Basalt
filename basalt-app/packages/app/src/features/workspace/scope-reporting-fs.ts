import type { Result, WorkspaceFileSystem } from "@basalt/core";

export function withScopeReporting(
    fs: WorkspaceFileSystem,
    onScopeDenied: () => void,
): WorkspaceFileSystem {
    async function report<T>(call: Promise<Result<T>>): Promise<Result<T>> {
        const result = await call;
        if (!result.ok && result.error.code === "scope-denied") {
            onScopeDenied();
        }
        return result;
    }
    return {
        list: () => report(fs.list()),
        stat: (path) => report(fs.stat(path)),
        readText: (path) => report(fs.readText(path)),
        readBytes: (path) => report(fs.readBytes(path)),
        writeTextAtomic: (path, text) => report(fs.writeTextAtomic(path, text)),
        createExclusive: (path, content) =>
            report(fs.createExclusive(path, content)),
        readDir: (path) => report(fs.readDir(path)),
        mkdir: (path) => report(fs.mkdir(path)),
        rename: (from, to) => report(fs.rename(from, to)),
        watch: (onEvent) => report(fs.watch(onEvent)),
    };
}
