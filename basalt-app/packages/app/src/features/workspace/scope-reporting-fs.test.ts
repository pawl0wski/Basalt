import { describe, expect, it, vi } from "vitest";
import {
    err,
    ok,
    type AppErrorCode,
    type Result,
    type WorkspaceFileSystem,
    type WorkspacePath,
} from "@basalt/core";
import { withScopeReporting } from "./scope-reporting-fs";

const path = "attachments/a.png" as WorkspacePath;

function fsReturning(result: Result<unknown>): WorkspaceFileSystem {
    const call = () => Promise.resolve(result);
    return {
        list: call,
        stat: call,
        readText: call,
        readBytes: call,
        writeTextAtomic: call,
        createExclusive: call,
        readDir: call,
        mkdir: call,
        rename: call,
        watch: call,
    } as WorkspaceFileSystem;
}

function calls(fs: WorkspaceFileSystem): Promise<Result<unknown>>[] {
    return [
        fs.list(),
        fs.stat(path),
        fs.readText(path),
        fs.readBytes(path),
        fs.writeTextAtomic(path, "x"),
        fs.createExclusive(path, "x"),
        fs.readDir(path),
        fs.mkdir(path),
        fs.rename(path, path),
        fs.watch(() => {}),
    ];
}

describe("withScopeReporting", () => {
    it("reports scope-denied from every method and passes the result through", async () => {
        const denied = err({ code: "scope-denied", message: "forbidden" });
        const onDenied = vi.fn();
        const results = await Promise.all(
            calls(withScopeReporting(fsReturning(denied), onDenied)),
        );
        expect(onDenied).toHaveBeenCalledTimes(10);
        for (const result of results) expect(result).toBe(denied);
    });

    it.each<AppErrorCode>(["permission-denied", "not-found", "unknown"])(
        "does not report %s",
        async (code) => {
            const failed = err({ code, message: "x" });
            const onDenied = vi.fn();
            const results = await Promise.all(
                calls(withScopeReporting(fsReturning(failed), onDenied)),
            );
            expect(onDenied).not.toHaveBeenCalled();
            for (const result of results) expect(result).toBe(failed);
        },
    );

    it("does not report successes and returns the same value", async () => {
        const success = ok("text");
        const onDenied = vi.fn();
        const results = await Promise.all(
            calls(withScopeReporting(fsReturning(success), onDenied)),
        );
        expect(onDenied).not.toHaveBeenCalled();
        for (const result of results) expect(result).toBe(success);
    });

    it("forwards arguments to the wrapped file system", async () => {
        const inner = fsReturning(ok(undefined));
        const writeTextAtomic = vi.spyOn(inner, "writeTextAtomic");
        await withScopeReporting(inner, () => {}).writeTextAtomic(path, "hi");
        expect(writeTextAtomic).toHaveBeenCalledWith(path, "hi");
    });
});
