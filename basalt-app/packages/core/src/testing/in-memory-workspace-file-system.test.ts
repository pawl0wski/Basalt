import { describe, expect, it } from "vitest";
import { toWorkspacePath, type WatchEvent, type WorkspacePath } from "../index";
import {
    createInMemoryWorkspaceFileSystem,
    describeWorkspaceFileSystemContract,
} from "./index";

function path(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(`expected valid path: ${input}`);
    return result.value;
}

const encode = (text: string) => new TextEncoder().encode(text);

describeWorkspaceFileSystemContract(() => {
    const memory = createInMemoryWorkspaceFileSystem();
    return {
        fs: memory,
        seedFile: memory.externalWrite,
        seedSymlink: memory.addSymlink,
        externalWrite: memory.externalWrite,
        externalDelete: memory.externalDelete,
        removeRoot: memory.removeRoot,
        failNextWrite: memory.failNextWrite,
    };
});

describe("in-memory workspace file system", () => {
    it("rejects rename with permission-denied in read-only mode and keeps the file", async () => {
        const memory = createInMemoryWorkspaceFileSystem({ readOnly: true });
        memory.externalWrite(path("a.md"), encode("original"));

        const result = await memory.rename(path("a.md"), path("b.md"));

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("permission-denied");
        expect((await memory.stat(path("a.md"))).ok).toBe(true);
        expect((await memory.stat(path("b.md"))).ok).toBe(false);
    });

    it("refuses to move a folder into itself and keeps it", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("d/a.md"), encode("x"));

        const result = await memory.rename(path("d"), path("d/inner"));

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("invalid-path");
        expect((await memory.stat(path("d/a.md"))).ok).toBe(true);
    });

    it("reports not-found when the destination folder does not exist", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("a.md"), encode("x"));

        const result = await memory.rename(path("a.md"), path("nope/a.md"));

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("not-found");
        expect((await memory.stat(path("a.md"))).ok).toBe(true);
    });

    it("fails rename once after failNextWrite and then recovers", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("a.md"), encode("x"));
        memory.failNextWrite();

        const failed = await memory.rename(path("a.md"), path("b.md"));
        const retried = await memory.rename(path("a.md"), path("b.md"));

        expect(failed.ok).toBe(false);
        expect(retried.ok).toBe(true);
    });

    it("rejects writes with permission-denied in read-only mode and keeps content", async () => {
        const memory = createInMemoryWorkspaceFileSystem({ readOnly: true });
        memory.externalWrite(path("a.md"), encode("original"));

        const overwrite = await memory.writeTextAtomic(path("a.md"), "x");
        const create = await memory.createExclusive(path("b.md"), "x");
        const createExisting = await memory.createExclusive(path("a.md"), "x");

        for (const result of [overwrite, create, createExisting]) {
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("permission-denied");
        }
        expect(await memory.readText(path("a.md"))).toEqual({
            ok: true,
            value: "original",
        });
        expect((await memory.stat(path("b.md"))).ok).toBe(false);
    });

    it("fails exactly one write after failNextWrite", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        const events: WatchEvent[] = [];
        await memory.watch((event) => events.push(event));
        memory.failNextWrite();

        const failed = await memory.writeTextAtomic(path("a.md"), "one");
        const succeeded = await memory.writeTextAtomic(path("a.md"), "two");

        expect(failed.ok).toBe(false);
        expect(succeeded.ok).toBe(true);
        expect(events).toEqual([{ kind: "changed", paths: ["a.md"] }]);
    });

    it("round-trips serializable state including bytes, symlinks and directories", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("dir/a.md"), Uint8Array.of(0xff, 0x00, 0x41));
        memory.externalWrite(path("b.md"), encode("Zażółć"));
        memory.addSymlink(path("link"));

        const serialized = JSON.stringify(memory.getState());
        const restored = createInMemoryWorkspaceFileSystem({
            state: JSON.parse(serialized),
        });

        expect(restored.getState()).toEqual(memory.getState());
        expect(await restored.list()).toEqual(await memory.list());
        expect(await restored.readText(path("b.md"))).toEqual({
            ok: true,
            value: "Zażółć",
        });
        const invalid = await restored.readText(path("dir/a.md"));
        expect(!invalid.ok && invalid.error.code).toBe("not-utf8");
        const stat = await restored.stat(path("b.md"));
        expect(stat).toEqual(await memory.stat(path("b.md")));
    });

    it("keeps modification times increasing after a restore", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("a.md"), encode("1"));
        const restored = createInMemoryWorkspaceFileSystem({
            state: memory.getState(),
        });
        const before = await restored.stat(path("a.md"));

        await restored.writeTextAtomic(path("a.md"), "2");
        const after = await restored.stat(path("a.md"));

        expect(before.ok && after.ok && after.value.mtimeMs).toBeGreaterThan(
            before.ok ? before.value.mtimeMs : Infinity,
        );
    });

    it("rejects invalid paths in restored state", () => {
        expect(() =>
            createInMemoryWorkspaceFileSystem({
                state: { entries: [{ path: "../x", kind: "directory" }] },
            }),
        ).toThrow();
    });

    it("reports unavailable from watch when failWatch is set", async () => {
        const memory = createInMemoryWorkspaceFileSystem({ failWatch: true });

        const result = await memory.watch(() => {});

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("unavailable");
        expect((await memory.writeTextAtomic(path("a.md"), "x")).ok).toBe(true);
    });

    it("reports unavailable for every operation after the root is removed", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("a.md"), encode("x"));
        memory.removeRoot();

        const results = await Promise.all([
            memory.list(),
            memory.stat(path("a.md")),
            memory.readText(path("a.md")),
            memory.writeTextAtomic(path("a.md"), "y"),
            memory.createExclusive(path("b.md"), "y"),
            memory.watch(() => {}),
        ]);

        for (const result of results) {
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("unavailable");
        }
    });

    it("deleting a directory removes its descendants", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("d/a.md"), encode("x"));
        memory.externalWrite(path("d2.md"), encode("x"));

        memory.externalDelete(path("d"));

        const list = await memory.list();
        expect(list.ok && list.value.map((entry) => entry.path)).toEqual([
            "d2.md",
        ]);
    });

    it("rejects writes through a symlink or onto a non-file entry", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.addSymlink(path("link"));
        memory.externalWrite(path("dir/a.md"), encode("x"));

        for (const target of ["link", "link/a.md", "dir"]) {
            const result = await memory.writeTextAtomic(path(target), "y");
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("invalid-path");
        }
    });

    it("refuses mkdir and byte creation in a read-only workspace and creates nothing", async () => {
        const memory = createInMemoryWorkspaceFileSystem({ readOnly: true });

        const made = await memory.mkdir(path("attachments"));
        const written = await memory.createExclusive(
            path("x.png"),
            Uint8Array.of(1),
        );

        expect(!made.ok && made.error.code).toBe("permission-denied");
        expect(!written.ok && written.error.code).toBe("permission-denied");
        const list = await memory.list();
        expect(list.ok && list.value).toEqual([]);
    });

    it("rejects mkdir below a file and readDir of a symlink without following it", async () => {
        const memory = createInMemoryWorkspaceFileSystem();
        memory.externalWrite(path("f"), encode("x"));
        memory.addSymlink(path("link"));

        const below = await memory.mkdir(path("f/sub"));
        const link = await memory.readDir(path("link"));

        expect(!below.ok && below.error.code).toBe("invalid-path");
        expect(!link.ok && link.error.code).toBe("invalid-path");
    });
});
