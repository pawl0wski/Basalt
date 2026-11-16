import {
    createAttachments,
    toWorkspacePath,
    type WorkspacePath,
} from "@basalt/core";
import { createInMemoryWorkspaceFileSystem } from "@basalt/core/testing";
import { describe, expect, it, vi } from "vitest";
import { createImageLoader } from "./image-loader";

function p(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(input);
    return result.value;
}

const be32 = (n: number) => [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
];
const png = (w = 2, h = 2, pad = 0) =>
    Uint8Array.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        0,
        0,
        0,
        13,
        0x49,
        0x48,
        0x44,
        0x52,
        ...be32(w),
        ...be32(h),
        8,
        6,
        0,
        0,
        0,
        ...new Array<number>(pad).fill(0),
    ]);

function setup(options: { budgetBytes?: number; notePath?: string } = {}) {
    const fs = createInMemoryWorkspaceFileSystem();
    const attachments = createAttachments({ fs });
    const readImage = vi.spyOn(attachments, "readImage");
    let counter = 0;
    const created: string[] = [];
    const revoked: string[] = [];
    const loader = createImageLoader({
        attachments,
        stat: (path) => fs.stat(path),
        notePath: p(options.notePath ?? "a.md"),
        budgetBytes: options.budgetBytes,
        createObjectUrl: () => {
            const url = `blob:${++counter}`;
            created.push(url);
            return url;
        },
        revokeObjectUrl: (url) => revoked.push(url),
    });
    return { fs, loader, readImage, created, revoked };
}

describe("createImageLoader", () => {
    it("loads a relative image into an object URL with its dimensions", async () => {
        const { fs, loader } = setup({ notePath: "Projects/n.md" });
        fs.externalWrite(p("attachments/x.png"), png(3, 4));
        expect(await loader.load("../attachments/x.png")).toEqual({
            kind: "image",
            src: "blob:1",
            dimensions: { width: 3, height: 4 },
        });
    });

    it.each([
        ["https://x.test/a.png", "remote"],
        ["data:image/png;base64,AA", "unsupported-scheme"],
        ["../../x.png", "invalid"],
        ["/x.png", "invalid"],
    ])("fails %s as %s without reading", async (destination, reason) => {
        const { loader, readImage } = setup();
        expect(await loader.load(destination)).toEqual({
            kind: "failed",
            reason,
        });
        expect(readImage).not.toHaveBeenCalled();
    });

    it.each([
        ["missing.png", undefined, "not-found"],
        ["fake.png", new TextEncoder().encode("hello"), "unsupported"],
        ["bomb.png", png(20000, 20000), "too-large"],
    ])("reports %s as %s", async (destination, bytes, reason) => {
        const { fs, loader } = setup();
        if (bytes) fs.externalWrite(p(destination), bytes);
        expect(await loader.load(destination)).toEqual({
            kind: "failed",
            reason,
        });
    });

    it("shares one read between concurrent and repeated requests", async () => {
        const { fs, loader, readImage } = setup();
        fs.externalWrite(p("x.png"), png());
        const [a, b] = await Promise.all([
            loader.load("x.png"),
            loader.load("x.png"),
        ]);
        await loader.load("x.png");
        expect(a).toBe(b);
        expect(readImage).toHaveBeenCalledTimes(1);
    });

    it("caches failures too", async () => {
        const { loader, readImage } = setup();
        await loader.load("missing.png");
        await loader.load("missing.png");
        expect(readImage).toHaveBeenCalledTimes(1);
    });

    it("keys the cache by the exact path, not by pathKey", async () => {
        const { fs, loader } = setup();
        fs.externalWrite(p("A.png"), png(1, 1));
        fs.externalWrite(p("a.png"), png(5, 5));
        const upper = await loader.load("A.png");
        const lower = await loader.load("a.png");
        expect(upper).toMatchObject({ dimensions: { width: 1, height: 1 } });
        expect(lower).toMatchObject({ dimensions: { width: 5, height: 5 } });
    });

    it("invalidate drops cached paths so the next load re-reads, and reports it", async () => {
        const { fs, loader, readImage } = setup();
        fs.externalWrite(p("x.png"), png(1, 1));
        await loader.load("x.png");
        expect(loader.invalidate([p("other.png")])).toBe(false);
        expect(loader.invalidate([p("x.png")])).toBe(true);
        fs.externalWrite(p("x.png"), png(9, 9));
        expect(await loader.load("x.png")).toMatchObject({
            dimensions: { width: 9, height: 9 },
        });
        expect(readImage).toHaveBeenCalledTimes(2);
    });

    it("invalidate returns false for uncached paths and invalidates a path without an image extension", async () => {
        const { fs, loader } = setup();
        expect(loader.invalidate([p("nothing.png")])).toBe(false);
        fs.externalWrite(p("diagram"), png());
        await loader.load("diagram");
        expect(loader.invalidate([p("diagram")])).toBe(true);
    });

    it("invalidate matches a path that differs only in case", async () => {
        const { fs, loader } = setup();
        fs.externalWrite(p("Attachments/X.PNG"), png());
        await loader.load("Attachments/X.PNG");
        expect(loader.invalidate([p("attachments/x.png")])).toBe(true);
    });

    it("invalidating a folder drops entries below it but not a sibling with the same prefix", async () => {
        const { fs, loader } = setup();
        fs.externalWrite(p("attachments/x.png"), png());
        fs.externalWrite(p("attachments-old/x.png"), png());
        await loader.load("attachments/x.png");
        await loader.load("attachments-old/x.png");
        expect(loader.invalidate([p("attachments")])).toBe(true);
        const { readImage } = setup();
        expect(readImage).not.toHaveBeenCalled();
        fs.externalDelete(p("attachments"));
        expect(await loader.load("attachments/x.png")).toMatchObject({
            reason: "not-found",
        });
        expect(await loader.load("attachments-old/x.png")).toMatchObject({
            kind: "image",
            src: "blob:2",
        });
    });

    it("revokes the old object URL only after the new result is stored", async () => {
        const { fs, loader, revoked } = setup();
        fs.externalWrite(p("x.png"), png(1, 1));
        const first = await loader.load("x.png");
        loader.invalidate([p("x.png")]);
        expect(revoked).toEqual([]);
        fs.externalWrite(p("x.png"), png(2, 2));
        const second = await loader.load("x.png");
        expect(
            first.kind === "image" &&
                second.kind === "image" &&
                first.src !== second.src,
        ).toBe(true);
        expect(revoked).toEqual(["blob:1"]);
    });

    it("revalidate re-reads only entries whose fingerprint changed", async () => {
        const { fs, loader, readImage } = setup();
        fs.externalWrite(p("same.png"), png(1, 1));
        fs.externalWrite(p("changed.png"), png(1, 1));
        await loader.load("same.png");
        await loader.load("changed.png");
        fs.externalWrite(p("changed.png"), png(1, 1, 4));
        expect(await loader.revalidate()).toBe(true);
        await loader.load("same.png");
        await loader.load("changed.png");
        expect(readImage).toHaveBeenCalledTimes(3);
        expect(await loader.revalidate()).toBe(false);
    });

    it("revalidate drops a missing entry whose file appeared", async () => {
        const { fs, loader } = setup();
        expect(await loader.load("later.png")).toMatchObject({
            reason: "not-found",
        });
        expect(await loader.revalidate()).toBe(false);
        fs.externalWrite(p("later.png"), png());
        expect(await loader.revalidate()).toBe(true);
        expect(await loader.load("later.png")).toMatchObject({ kind: "image" });
    });

    it("evicts the least recently used released entry over budget and revokes its URL", async () => {
        const { fs, loader, revoked } = setup({ budgetBytes: 80 });
        for (const name of ["a", "b", "c"])
            fs.externalWrite(p(`${name}.png`), png(1, 1, 7));
        await loader.load("a.png");
        loader.release("a.png");
        await loader.load("b.png");
        loader.release("b.png");
        await loader.load("a.png");
        loader.release("a.png");
        await loader.load("c.png");
        expect(revoked).toEqual(["blob:2"]);
    });

    it("never evicts a mounted entry even over budget", async () => {
        const { fs, loader, revoked } = setup({ budgetBytes: 10 });
        fs.externalWrite(p("a.png"), png(1, 1, 20));
        fs.externalWrite(p("b.png"), png(1, 1, 20));
        await loader.load("a.png");
        await loader.load("b.png");
        expect(revoked).toEqual([]);
    });

    it("does not count failures towards the budget", async () => {
        const { fs, loader, revoked } = setup({ budgetBytes: 40 });
        fs.externalWrite(p("a.png"), png(1, 1));
        await loader.load("a.png");
        loader.release("a.png");
        for (let i = 0; i < 20; i++) await loader.load(`missing${i}.png`);
        expect(revoked).toEqual([]);
    });

    it("revokes every URL on dispose, including retired ones", async () => {
        const { fs, loader, revoked } = setup();
        fs.externalWrite(p("a.png"), png());
        fs.externalWrite(p("b.png"), png());
        await loader.load("a.png");
        await loader.load("b.png");
        loader.invalidate([p("a.png")]);
        loader.dispose();
        expect([...revoked].sort()).toEqual(["blob:1", "blob:2"]);
    });
});
