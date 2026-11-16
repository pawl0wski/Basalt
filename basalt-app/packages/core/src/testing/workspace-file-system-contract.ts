import { describe, expect, it, vi } from "vitest";
import type { WatchEvent, WorkspaceFileSystem } from "../ports";
import { toWorkspacePath, type WorkspacePath } from "../workspace-path";

export interface WorkspaceFileSystemFixture {
    readonly fs: WorkspaceFileSystem;
    seedFile(path: WorkspacePath, bytes: Uint8Array): void | Promise<void>;
    seedSymlink(path: WorkspacePath): void | Promise<void>;
    externalWrite(path: WorkspacePath, bytes: Uint8Array): void | Promise<void>;
    externalDelete(path: WorkspacePath): void | Promise<void>;
    removeRoot(): void | Promise<void>;
    failNextWrite(): void;
}

function path(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(`expected valid path: ${input}`);
    return result.value;
}

const encode = (text: string) => new TextEncoder().encode(text);

export function describeWorkspaceFileSystemContract(
    createFixture: () =>
        WorkspaceFileSystemFixture | Promise<WorkspaceFileSystemFixture>,
): void {
    describe("WorkspaceFileSystem contract", () => {
        async function watched() {
            const fixture = await createFixture();
            const events: WatchEvent[] = [];
            const watching = await fixture.fs.watch((event) =>
                events.push(event),
            );
            if (!watching.ok) throw new Error("watch must start");
            return { fixture, events, unwatch: watching.value };
        }

        describe("readText", () => {
            it("returns the file content", async () => {
                const { fs, seedFile } = await createFixture();
                await seedFile(path("a.md"), encode("Zażółć\nline"));

                expect(await fs.readText(path("a.md"))).toEqual({
                    ok: true,
                    value: "Zażółć\nline",
                });
            });

            it("reports not-found for a missing file", async () => {
                const { fs } = await createFixture();

                const result = await fs.readText(path("missing.md"));

                expect(result.ok).toBe(false);
                if (!result.ok) expect(result.error.code).toBe("not-found");
            });

            it("reports not-utf8 for invalid bytes", async () => {
                const { fs, seedFile } = await createFixture();
                await seedFile(path("bin.md"), Uint8Array.of(0x61, 0xff, 0xfe));

                const result = await fs.readText(path("bin.md"));

                expect(result.ok).toBe(false);
                if (!result.ok) expect(result.error.code).toBe("not-utf8");
            });
        });

        describe("readBytes", () => {
            it("round-trips exact bytes including NUL and invalid UTF-8", async () => {
                const { fs, seedFile } = await createFixture();
                const bytes = Uint8Array.of(0x00, 0xff, 0xfe, 0x80, 0x41, 0x00);
                await seedFile(path("img.png"), bytes);

                const result = await fs.readBytes(path("img.png"));

                expect(result.ok && Array.from(result.value)).toEqual(
                    Array.from(bytes),
                );
            });

            it("returns the UTF-8 bytes of text written with writeTextAtomic", async () => {
                const { fs } = await createFixture();
                await fs.writeTextAtomic(path("a.md"), "Zażółć");

                const result = await fs.readBytes(path("a.md"));

                expect(result.ok && Array.from(result.value)).toEqual(
                    Array.from(encode("Zażółć")),
                );
            });

            it("reports not-found for a missing path", async () => {
                const { fs } = await createFixture();

                const result = await fs.readBytes(path("missing.png"));

                expect(result.ok).toBe(false);
                if (!result.ok) expect(result.error.code).toBe("not-found");
            });
        });

        describe("stat", () => {
            it("reports kind, size in bytes and mtime of a file", async () => {
                const { fs, seedFile } = await createFixture();
                await seedFile(path("dir/a.md"), encode("żż"));

                const result = await fs.stat(path("dir/a.md"));

                expect(result.ok).toBe(true);
                if (result.ok) {
                    expect(result.value.kind).toBe("file");
                    expect(result.value.size).toBe(4);
                    expect(result.value.mtimeMs).toBeGreaterThan(0);
                }
                const directory = await fs.stat(path("dir"));
                expect(directory.ok && directory.value.kind).toBe("directory");
            });

            it("reports a symlink as a symlink without following it", async () => {
                const { fs, seedSymlink } = await createFixture();
                await seedSymlink(path("link.md"));

                const result = await fs.stat(path("link.md"));

                expect(result.ok && result.value.kind).toBe("symlink");
            });

            it("reports not-found for a missing entry", async () => {
                const { fs } = await createFixture();

                const result = await fs.stat(path("missing.md"));

                expect(result.ok).toBe(false);
                if (!result.ok) expect(result.error.code).toBe("not-found");
            });
        });

        describe("list", () => {
            it("is empty for an empty workspace", async () => {
                const { fs } = await createFixture();

                expect(await fs.list()).toEqual({ ok: true, value: [] });
            });

            it("lists files recursively and does not follow symlinks", async () => {
                const { fs, seedFile, seedSymlink } = await createFixture();
                await seedFile(path("a.md"), encode("a"));
                await seedFile(path("sub/deep/b.md"), encode("b"));
                await seedSymlink(path("link"));

                const result = await fs.list();

                expect(result.ok).toBe(true);
                if (!result.ok) return;
                const kinds = Object.fromEntries(
                    result.value.map((entry) => [entry.path, entry.kind]),
                );
                expect(kinds).toEqual({
                    "a.md": "file",
                    sub: "directory",
                    "sub/deep": "directory",
                    "sub/deep/b.md": "file",
                    link: "symlink",
                });
            });
        });

        describe("writeTextAtomic", () => {
            it("creates a missing file and replaces an existing one", async () => {
                const { fs } = await createFixture();

                expect(
                    (await fs.writeTextAtomic(path("n/a.md"), "one")).ok,
                ).toBe(true);
                expect(
                    (await fs.writeTextAtomic(path("n/a.md"), "two")).ok,
                ).toBe(true);

                expect(await fs.readText(path("n/a.md"))).toEqual({
                    ok: true,
                    value: "two",
                });
            });

            it("leaves the original untouched when the write fails", async () => {
                const fixture = await createFixture();
                await fixture.seedFile(path("a.md"), encode("original"));
                fixture.failNextWrite();

                const result = await fixture.fs.writeTextAtomic(
                    path("a.md"),
                    "replacement",
                );

                expect(result.ok).toBe(false);
                expect(await fixture.fs.readText(path("a.md"))).toEqual({
                    ok: true,
                    value: "original",
                });
                const list = await fixture.fs.list();
                expect(
                    list.ok && list.value.map((entry) => entry.path),
                ).toEqual(["a.md"]);
            });
        });

        describe("createExclusive", () => {
            it("creates a new file", async () => {
                const { fs } = await createFixture();

                expect(
                    (await fs.createExclusive(path("new.md"), "text")).ok,
                ).toBe(true);

                expect(await fs.readText(path("new.md"))).toEqual({
                    ok: true,
                    value: "text",
                });
            });

            it("refuses to overwrite and keeps the existing content", async () => {
                const { fs, seedFile } = await createFixture();
                await seedFile(path("a.md"), encode("original"));

                const result = await fs.createExclusive(path("a.md"), "other");

                expect(result.ok).toBe(false);
                if (!result.ok)
                    expect(result.error.code).toBe("already-exists");
                expect(await fs.readText(path("a.md"))).toEqual({
                    ok: true,
                    value: "original",
                });
            });

            it("does not leave a file behind when the write fails", async () => {
                const fixture = await createFixture();
                fixture.failNextWrite();

                const result = await fixture.fs.createExclusive(
                    path("new.md"),
                    "text",
                );

                expect(result.ok).toBe(false);
                const stat = await fixture.fs.stat(path("new.md"));
                expect(stat.ok).toBe(false);
            });
        });

        describe("createExclusive with bytes", () => {
            it("writes the bytes as-is and refuses to overwrite", async () => {
                const { fs } = await createFixture();
                const bytes = Uint8Array.of(0x00, 0xff, 0xfe, 0x80);

                expect(
                    (await fs.createExclusive(path("attachments/a.bin"), bytes))
                        .ok,
                ).toBe(true);
                const again = await fs.createExclusive(
                    path("attachments/a.bin"),
                    Uint8Array.of(1),
                );

                expect(again.ok).toBe(false);
                if (!again.ok) expect(again.error.code).toBe("already-exists");
                const read = await fs.readBytes(path("attachments/a.bin"));
                expect(read.ok && Array.from(read.value)).toEqual(
                    Array.from(bytes),
                );
            });
        });

        describe("readDir", () => {
            it("lists direct children only and reports symlinks without following", async () => {
                const { fs, seedFile, seedSymlink } = await createFixture();
                await seedFile(path("d/a.png"), encode("a"));
                await seedFile(path("d/sub/deep.png"), encode("b"));
                await seedSymlink(path("d/link"));
                await seedFile(path("other.png"), encode("c"));

                const result = await fs.readDir(path("d"));

                expect(result.ok && result.value).toEqual(
                    expect.arrayContaining([
                        { path: "d/a.png", kind: "file" },
                        { path: "d/sub", kind: "directory" },
                        { path: "d/link", kind: "symlink" },
                    ]),
                );
                expect(result.ok && result.value).toHaveLength(3);
            });

            it("reports not-found for a missing folder and invalid-path for a file", async () => {
                const { fs, seedFile } = await createFixture();
                await seedFile(path("a.md"), encode("x"));

                const missing = await fs.readDir(path("nope"));
                const file = await fs.readDir(path("a.md"));

                expect(!missing.ok && missing.error.code).toBe("not-found");
                expect(!file.ok && file.error.code).toBe("invalid-path");
            });
        });

        describe("mkdir", () => {
            it("creates missing parents and is idempotent", async () => {
                const { fs } = await createFixture();

                expect((await fs.mkdir(path("a/b/c"))).ok).toBe(true);
                expect((await fs.mkdir(path("a/b/c"))).ok).toBe(true);

                const stat = await fs.stat(path("a/b"));
                expect(stat.ok && stat.value.kind).toBe("directory");
            });

            it("fails with already-exists over a file", async () => {
                const { fs, seedFile } = await createFixture();
                await seedFile(path("attachments"), encode("x"));

                const result = await fs.mkdir(path("attachments"));

                expect(!result.ok && result.error.code).toBe("already-exists");
            });

            it("emits a changed event when it creates a folder", async () => {
                const { fixture, events, unwatch } = await watched();

                await fixture.fs.mkdir(path("new/folder"));

                expect(
                    events.some(
                        (event) =>
                            event.kind === "changed" &&
                            event.paths.some((changed) =>
                                changed.startsWith("new"),
                            ),
                    ),
                ).toBe(true);
                await unwatch();
            });
        });

        describe("watch", () => {
            it("emits a changed event for the app's own writes", async () => {
                const { fixture, events } = await watched();

                await fixture.fs.writeTextAtomic(path("a.md"), "x");
                await fixture.fs.createExclusive(path("b.md"), "y");

                await vi.waitFor(() => {
                    const changed = events.flatMap((event) =>
                        event.kind === "changed" ? event.paths : [],
                    );
                    expect(changed).toContain("a.md");
                    expect(changed).toContain("b.md");
                });
            });

            it("emits changed events for external writes and deletions", async () => {
                const { fixture, events } = await watched();
                await fixture.seedFile(path("a.md"), encode("x"));
                events.length = 0;

                await fixture.externalWrite(path("a.md"), encode("changed"));
                await vi.waitFor(() =>
                    expect(events).toContainEqual({
                        kind: "changed",
                        paths: ["a.md"],
                    }),
                );

                events.length = 0;
                await fixture.externalDelete(path("a.md"));
                await vi.waitFor(() =>
                    expect(events).toContainEqual({
                        kind: "changed",
                        paths: ["a.md"],
                    }),
                );
                expect((await fixture.fs.stat(path("a.md"))).ok).toBe(false);
            });

            it("emits root-lost when the root disappears", async () => {
                const { fixture, events } = await watched();

                await fixture.removeRoot();

                await vi.waitFor(() =>
                    expect(events).toContainEqual({ kind: "root-lost" }),
                );
            });

            it("stops emitting after unwatch", async () => {
                const { fixture, events, unwatch } = await watched();

                await unwatch();
                await fixture.externalWrite(path("a.md"), encode("x"));
                await fixture.fs.writeTextAtomic(path("b.md"), "y");
                await new Promise((resolve) => setTimeout(resolve, 20));

                expect(events).toEqual([]);
            });
        });
    });
}
