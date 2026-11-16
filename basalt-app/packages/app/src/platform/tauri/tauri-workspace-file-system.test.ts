import { afterEach, describe, expect, it, vi } from "vitest";
import {
    toWorkspacePath,
    type WatchEvent,
    type WorkspacePath,
    type WorkspaceRoot,
} from "@basalt/core";
import { describeWorkspaceFileSystemContract } from "@basalt/core/testing";
import { createTauriWorkspaceAccess } from "./tauri-workspace-access";
import { createTauriWorkspaceFileSystem } from "./tauri-workspace-file-system";
import {
    installFakePluginFs,
    type FakePluginFs,
} from "./testing/fake-plugin-fs";

const ROOT = "/ws";
const encode = (text: string) => Array.from(new TextEncoder().encode(text));

function path(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(`invalid path ${input}`);
    return result.value;
}

let installed: FakePluginFs | undefined;

function setup() {
    installed = installFakePluginFs(ROOT);
    return {
        plugin: installed,
        fs: createTauriWorkspaceFileSystem(ROOT as WorkspaceRoot),
    };
}

afterEach(() => installed?.uninstall());

describeWorkspaceFileSystemContract(() => {
    const { plugin, fs } = setup();
    return {
        fs,
        seedFile: (target, bytes) =>
            plugin.seedFile(`${ROOT}/${target}`, bytes),
        seedSymlink: (target) => plugin.seedSymlink(`${ROOT}/${target}`),
        externalWrite: (target, bytes) =>
            plugin.externalWrite(`${ROOT}/${target}`, bytes),
        externalDelete: (target) => plugin.externalDelete(`${ROOT}/${target}`),
        removeRoot: () => plugin.removeRoot(),
        failNextWrite: () => plugin.failNext("write_file"),
    };
});

describe("TauriWorkspaceFileSystem", () => {
    describe("readText", () => {
        it("keeps a leading BOM so note use cases can detect it", async () => {
            const { plugin, fs } = setup();
            plugin.seedFile(
                `${ROOT}/bom.md`,
                Uint8Array.of(0xef, 0xbb, 0xbf, 0x68, 0x69),
            );

            expect(await fs.readText(path("bom.md"))).toEqual({
                ok: true,
                value: "\uFEFFhi",
            });
        });

        it("reports not-utf8 without leaking content and never uses readTextFile", async () => {
            const { plugin, fs } = setup();
            plugin.seedFile(
                `${ROOT}/bin.md`,
                Uint8Array.of(0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0xff),
            );

            const result = await fs.readText(path("bin.md"));

            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.code).toBe("not-utf8");
                expect(result.error.message).not.toContain("secret");
            }
            expect(plugin.calls).toContain("read_file");
        });

        it("maps a plugin permission failure to permission-denied", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "x");
            plugin.failNext("read_file", "Permission denied (os error 13)");

            const result = await fs.readText(path("a.md"));

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("permission-denied");
        });
    });

    describe("stat", () => {
        it("uses lstat so that symlinks are reported, not followed", async () => {
            const { plugin, fs } = setup();
            plugin.seedSymlink(`${ROOT}/link.md`);

            const result = await fs.stat(path("link.md"));

            expect(result.ok && result.value.kind).toBe("symlink");
            expect(plugin.calls).toContain("lstat");
            expect(plugin.calls).not.toContain("stat");
        });
    });

    describe("list", () => {
        it("skips names with a backslash and does not descend into symlinks", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/ok.md`, "x");
            plugin.seedText(`${ROOT}/bad\\name.md`, "x");
            plugin.seedSymlink(`${ROOT}/linked`);

            const result = await fs.list();

            expect(
                result.ok && result.value.map((entry) => entry.path),
            ).toEqual(expect.arrayContaining(["ok.md", "linked"]));
            expect(result.ok && result.value).toHaveLength(2);
            expect(
                plugin.calls.filter((call) => call === "read_dir"),
            ).toHaveLength(1);
        });

        it("reports not-found when the root is gone", async () => {
            const { plugin, fs } = setup();
            plugin.removeRoot();

            const result = await fs.list();

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("not-found");
        });
    });

    describe("writeTextAtomic", () => {
        it("writes through a temp file next to the target and leaves none behind", async () => {
            const { plugin, fs } = setup();

            await fs.writeTextAtomic(path("sub/a.md"), "text");

            expect(plugin.calls.filter((c) => c === "write_file")).toHaveLength(
                1,
            );
            expect(plugin.calls).toContain("rename");
            expect(
                [...plugin.entries.keys()].filter((key) =>
                    key.includes("basalt-tmp"),
                ),
            ).toEqual([]);
            expect(plugin.readBytes(`${ROOT}/sub/a.md`)).toEqual(
                encode("text"),
            );
        });

        it("keeps the original and removes the temp file when the rename fails", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "original");
            plugin.failNext("rename");

            const result = await fs.writeTextAtomic(
                path("a.md"),
                "replacement",
            );

            expect(result.ok).toBe(false);
            expect(plugin.readBytes(`${ROOT}/a.md`)).toEqual(
                encode("original"),
            );
            expect(plugin.entries.has(`${ROOT}/.a.md.basalt-tmp`)).toBe(false);
            expect(plugin.calls).toContain("remove");
        });

        it("replaces a stray temp file left by an earlier crash", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/.a.md.basalt-tmp`, "stale");

            const result = await fs.writeTextAtomic(path("a.md"), "fresh");

            expect(result.ok).toBe(true);
            expect(plugin.entries.has(`${ROOT}/.a.md.basalt-tmp`)).toBe(false);
            expect(plugin.readBytes(`${ROOT}/a.md`)).toEqual(encode("fresh"));
        });

        it("writes a BOM exactly as given in the text", async () => {
            const { plugin, fs } = setup();

            await fs.writeTextAtomic(path("a.md"), "\uFEFFhi");

            expect(plugin.readBytes(`${ROOT}/a.md`)).toEqual([
                0xef, 0xbb, 0xbf, 0x68, 0x69,
            ]);
        });
    });

    describe("createExclusive", () => {
        it("reports already-exists from the plugin and keeps the file", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "original");

            const result = await fs.createExclusive(path("a.md"), "other");

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("already-exists");
            expect(plugin.readBytes(`${ROOT}/a.md`)).toEqual(
                encode("original"),
            );
            expect(plugin.calls).not.toContain("remove");
        });

        it("does not remove a file it did not create when the write fails with an unknown error", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "created by someone else");
            plugin.failNext("write_file", "something unexpected");

            const result = await fs.createExclusive(path("a.md"), "other");

            expect(result.ok).toBe(false);
            expect(plugin.readBytes(`${ROOT}/a.md`)).toEqual(
                encode("created by someone else"),
            );
            expect(plugin.calls).not.toContain("remove");
        });

        it("removes the file it created when the write fails with an unknown error", async () => {
            const { plugin, fs } = setup();
            plugin.failNext("write_file", "something unexpected");

            const result = await fs.createExclusive(path("a.md"), "text");

            expect(result.ok).toBe(false);
            expect(plugin.calls).toContain("remove");
        });
    });

    describe("rename", () => {
        it("moves a folder with its content through the plugin rename", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/old/sub/a.md`, "deep");

            const result = await fs.rename(path("old"), path("new"));

            expect(result.ok).toBe(true);
            expect(plugin.calls).toContain("rename");
            expect(plugin.readBytes(`${ROOT}/new/sub/a.md`)).toEqual(
                encode("deep"),
            );
            expect(plugin.entries.has(`${ROOT}/old`)).toBe(false);
        });

        it("reports already-exists without calling the plugin rename that would overwrite", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "one");
            plugin.seedText(`${ROOT}/b.md`, "two");

            const result = await fs.rename(path("a.md"), path("b.md"));

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("already-exists");
            expect(plugin.calls).not.toContain("rename");
            expect(plugin.readBytes(`${ROOT}/b.md`)).toEqual(encode("two"));
        });

        it("reports not-found for a missing source before touching the destination", async () => {
            const { plugin, fs } = setup();

            const result = await fs.rename(path("no.md"), path("b.md"));

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("not-found");
            expect(plugin.calls).not.toContain("rename");
        });

        it("allows a case-only change when only the source exists", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/dir/a.md`, "x");

            const result = await fs.rename(path("dir/a.md"), path("dir/A.md"));

            expect(result.ok).toBe(true);
            expect(plugin.calls).toContain("rename");
            expect(plugin.readBytes(`${ROOT}/dir/A.md`)).toEqual(encode("x"));
        });

        it("refuses a case-only change onto a distinct existing entry", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "lower");
            plugin.seedText(`${ROOT}/A.md`, "upper");

            const result = await fs.rename(path("a.md"), path("A.md"));

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("already-exists");
            expect(plugin.calls).not.toContain("rename");
            expect(plugin.readBytes(`${ROOT}/A.md`)).toEqual(encode("upper"));
        });

        it("maps a plugin permission failure to permission-denied and keeps the file", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "x");
            plugin.failNext("rename", "Permission denied (os error 13)");

            const result = await fs.rename(path("a.md"), path("b.md"));

            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.code).toBe("permission-denied");
            }
            expect(plugin.readBytes(`${ROOT}/a.md`)).toEqual(encode("x"));
        });

        it("maps a rename failure of the plugin to a typed error, not a throw", async () => {
            const { plugin, fs } = setup();
            plugin.seedText(`${ROOT}/a.md`, "x");
            plugin.failNext("rename", "something unexpected");

            const result = await fs.rename(path("a.md"), path("b.md"));

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("unknown");
        });
    });

    describe("watch", () => {
        async function watched() {
            const { plugin, fs } = setup();
            const events: WatchEvent[] = [];
            const started = await fs.watch((event) => events.push(event));
            if (!started.ok) throw new Error("watch must start");
            return { plugin, events, unwatch: started.value };
        }

        it("watches the root recursively with the debounced variant", async () => {
            const { plugin } = await watched();

            expect(plugin.watchOptions).toEqual([
                { recursive: true, delayMs: expect.any(Number) },
            ]);
        });

        it("maps native paths and drops those outside the root or not representable", async () => {
            const { plugin, events } = await watched();

            plugin.emitRaw({
                type: { modify: { kind: "data", mode: "content" } },
                paths: [
                    "/ws/n/b.md",
                    "/ws/a.md",
                    "/ws/a.md",
                    "/other/x.md",
                    "/ws2/a.md",
                    "/ws/bad\\name.md",
                ],
            });

            await vi.waitFor(() =>
                expect(events).toEqual([
                    { kind: "changed", paths: ["n/b.md", "a.md"] },
                ]),
            );
        });

        it("emits nothing when every path is dropped, and ignores access events", async () => {
            const { plugin, events } = await watched();

            plugin.emitRaw({ type: "any", paths: ["/other/x.md"] });
            plugin.emitRaw({
                type: { access: { kind: "close", mode: "read" } },
                paths: ["/ws/a.md"],
            });
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(events).toEqual([]);
        });

        it("emits root-lost only when an event touches a root that is gone", async () => {
            const { plugin, events } = await watched();

            plugin.emitRaw({
                type: { modify: { kind: "metadata", mode: "any" } },
                paths: ["/ws"],
            });
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(events).toEqual([]);

            plugin.removeRoot();
            await vi.waitFor(() =>
                expect(events).toEqual([{ kind: "root-lost" }]),
            );
        });

        it("reports unavailable when the watcher cannot start", async () => {
            const { plugin, fs } = setup();
            plugin.failNext("watch", "Permission denied (os error 13)");

            const result = await fs.watch(() => undefined);

            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.error.code).toBe("unavailable");
        });

        it("closes the plugin watcher and drops late events on unwatch", async () => {
            const { plugin, events, unwatch } = await watched();
            expect(plugin.watcherCount()).toBe(1);

            await unwatch();
            plugin.emitRaw({ type: "any", paths: ["/ws/a.md"] });
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(plugin.watcherCount()).toBe(0);
            expect(events).toEqual([]);
        });
    });
});

describe("TauriWorkspaceAccess", () => {
    it("opens an existing directory as a file system", async () => {
        const plugin = installFakePluginFs(ROOT);
        installed = plugin;
        plugin.seedText(`${ROOT}/a.md`, "x");

        const opened = await createTauriWorkspaceAccess().open(
            ROOT as WorkspaceRoot,
        );

        expect(opened.ok).toBe(true);
        if (opened.ok) {
            expect(await opened.value.readText(path("a.md"))).toEqual({
                ok: true,
                value: "x",
            });
        }
    });

    it.each([
        ["a deleted folder", ROOT, "not-found"],
        ["a folder outside the fs scope", "/elsewhere", "scope-denied"],
        ["a regular file", `${ROOT}/file.md`, "invalid-path"],
    ])("rejects %s", async (_label, root, code) => {
        const plugin = installFakePluginFs(ROOT);
        installed = plugin;
        plugin.seedText(`${ROOT}/file.md`, "x");
        if (code === "not-found") plugin.removeRoot();

        const opened = await createTauriWorkspaceAccess().open(
            root as WorkspaceRoot,
        );

        expect(opened.ok).toBe(false);
        if (!opened.ok) expect(opened.error.code).toBe(code);
    });
});
