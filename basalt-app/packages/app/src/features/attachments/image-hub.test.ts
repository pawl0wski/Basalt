import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHarness, root, seedFs, settle, wsPath } from "../test-harness";

const A = root("/a");
const be32 = (n: number) => [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
];
const png = (w: number) =>
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
        ...be32(1),
        8,
        6,
        0,
        0,
        0,
    ]);

async function open(
    files: Record<string, string | Uint8Array>,
    failWatch = false,
) {
    const fs = seedFs(files, { failWatch });
    const h = createHarness({ workspaces: { [A]: fs }, picked: A });
    await h.workspaceActions.openWorkspace();
    return { h, fs };
}

describe("image hub wiring", () => {
    beforeEach(() => {
        let counter = 0;
        URL.createObjectURL = () => `blob:test${++counter}`;
        URL.revokeObjectURL = () => undefined;
    });

    it("loads images of the open workspace relative to the note", async () => {
        const { h } = await open({ "a.md": "", "attachments/x.png": png(3) });
        const images = h.images.forNote(wsPath("a.md"));
        const result = await images.loader.load("attachments/x.png");
        expect(result).toMatchObject({
            kind: "image",
            dimensions: { width: 3, height: 1 },
        });
        images.dispose();
    });

    it("notifies a note when the watcher reports a change to a shown image", async () => {
        const { h, fs } = await open({ "a.md": "", "x.png": png(1) });
        const images = h.images.forNote(wsPath("a.md"));
        const listener = vi.fn();
        images.subscribe(listener);
        await images.loader.load("x.png");

        fs.externalWrite(wsPath("x.png"), png(2));
        h.watchScheduler.fire();
        await settle();

        expect(listener).toHaveBeenCalledTimes(1);
        expect(await images.loader.load("x.png")).toMatchObject({
            dimensions: { width: 2 },
        });
    });

    it("does not notify for a change to an image that was never loaded", async () => {
        const { h, fs } = await open({ "a.md": "" });
        const images = h.images.forNote(wsPath("a.md"));
        const listener = vi.fn();
        images.subscribe(listener);

        fs.externalWrite(wsPath("other.png"), png(1));
        h.watchScheduler.fire();
        await settle();

        expect(listener).not.toHaveBeenCalled();
    });

    it("keeps notifying after a dispose followed by activate, as React strict mode does", async () => {
        const { h, fs } = await open({ "a.md": "", "x.png": png(1) });
        const images = h.images.forNote(wsPath("a.md"));
        const listener = vi.fn();
        images.subscribe(listener);
        images.dispose();
        images.activate();
        await images.loader.load("x.png");

        fs.externalWrite(wsPath("x.png"), png(2));
        h.watchScheduler.fire();
        await settle();

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("stops notifying a disposed note", async () => {
        const { h, fs } = await open({ "a.md": "", "x.png": png(1) });
        const images = h.images.forNote(wsPath("a.md"));
        const listener = vi.fn();
        images.subscribe(listener);
        await images.loader.load("x.png");
        images.dispose();
        await images.loader.load("x.png");

        fs.externalWrite(wsPath("x.png"), png(2));
        h.watchScheduler.fire();
        await settle();

        expect(listener).not.toHaveBeenCalled();
    });

    it("stops notifying after unsubscribe", async () => {
        const { h, fs } = await open({ "a.md": "", "x.png": png(1) });
        const images = h.images.forNote(wsPath("a.md"));
        const listener = vi.fn();
        images.subscribe(listener)();
        await images.loader.load("x.png");

        fs.externalWrite(wsPath("x.png"), png(2));
        h.watchScheduler.fire();
        await settle();

        expect(listener).not.toHaveBeenCalled();
    });

    it("turns a missing image into the image on window focus in focus-fallback mode", async () => {
        const { h, fs } = await open({ "a.md": "" }, true);
        const images = h.images.forNote(wsPath("a.md"));
        const listener = vi.fn();
        images.subscribe(listener);
        expect(await images.loader.load("late.png")).toMatchObject({
            reason: "not-found",
        });

        fs.externalWrite(wsPath("late.png"), png(1));
        await h.workspaceActions.refreshOnFocus();

        expect(listener).toHaveBeenCalledTimes(1);
        expect(await images.loader.load("late.png")).toMatchObject({
            kind: "image",
        });
    });

    it("does not revalidate on focus while the live watcher runs", async () => {
        const { h, fs } = await open({ "a.md": "" });
        const images = h.images.forNote(wsPath("a.md"));
        const listener = vi.fn();
        images.subscribe(listener);
        await images.loader.load("late.png");

        fs.externalWrite(wsPath("late.png"), png(1));
        await h.workspaceActions.refreshOnFocus();

        expect(listener).not.toHaveBeenCalled();
    });

    it("fails with unavailable outside a workspace and disposes loaders on leave", async () => {
        const detached = createHarness({ workspaces: {}, picked: null });
        const loose = detached.images.forNote(wsPath("a.md"));
        expect(await loose.loader.load("x.png")).toMatchObject({
            reason: "unavailable",
        });

        const { h } = await open({ "a.md": "", "x.png": png(1) });
        const images = h.images.forNote(wsPath("a.md"));
        const revoke = vi
            .spyOn(URL, "revokeObjectURL")
            .mockImplementation(() => undefined);
        await images.loader.load("x.png");
        await h.workspaceActions.leaveWorkspace();
        expect(revoke).toHaveBeenCalledWith("blob:test1");
        revoke.mockRestore();
    });
});
