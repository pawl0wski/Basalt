import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    defaultAppSettings,
    type WatchEvent,
    type WorkspaceFileSystem,
    type WorkspaceRoot,
} from "@basalt/core";
import { createMemoryPlatform, WORKSPACES_KEY } from "./memory-platform";
import { DEMO_WORKSPACE_ROOT } from "./demo-workspace";
import { installMemoryPlatform } from "./index";

const ROOT = "/ws" as WorkspaceRoot;
const bytes = (text: string) => new TextEncoder().encode(text);

async function openRoot(
    platform: ReturnType<typeof createMemoryPlatform>["platform"],
): Promise<WorkspaceFileSystem> {
    const opened = await platform.access.open(ROOT);
    if (!opened.ok) throw new Error(opened.error.message);
    return opened.value;
}

function collect(fs: WorkspaceFileSystem) {
    const events: WatchEvent[] = [];
    return fs
        .watch((event) => events.push(event))
        .then((result) => {
            expect(result.ok).toBe(true);
            return events;
        });
}

describe("memory platform", () => {
    beforeEach(() => localStorage.clear());

    it("keeps saved notes and app settings across a reload", async () => {
        const first = createMemoryPlatform(localStorage);
        first.testFs.seedWorkspace(ROOT, { "a.md": "# A" });
        const fs = await openRoot(first.platform);
        await fs.writeTextAtomic("b.md" as never, "# B");
        await first.platform.settings.save({
            ...defaultAppSettings(),
            lastWorkspace: ROOT,
        });

        const second = createMemoryPlatform(localStorage);
        const reopened = await openRoot(second.platform);
        const settings = await second.platform.settings.load();

        expect(await reopened.readText("b.md" as never)).toEqual({
            ok: true,
            value: "# B",
        });
        expect(settings.ok && settings.value.lastWorkspace).toBe(ROOT);
        expect(second.testFs.listFiles()).toEqual(["a.md", "b.md"]);
    });

    it("persists external changes and root removal", async () => {
        const first = createMemoryPlatform(localStorage);
        first.testFs.seedWorkspace(ROOT, { "a.md": "x" });
        await openRoot(first.platform);
        first.testFs.externalWrite("c.md", bytes("c"));
        first.testFs.externalDelete("a.md");
        const reloaded = createMemoryPlatform(localStorage);
        await openRoot(reloaded.platform);
        expect(reloaded.testFs.listFiles()).toEqual(["c.md"]);

        first.testFs.removeRoot();
        const gone =
            await createMemoryPlatform(localStorage).platform.access.open(ROOT);
        expect(gone.ok).toBe(false);
        if (!gone.ok) expect(gone.error.code).toBe("not-found");
    });

    it("fires watch events for external changes and root loss", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, { "a.md": "x" });
        const events = await collect(await openRoot(platform));

        testFs.externalWrite("a.md", bytes("y"));
        testFs.externalDelete("a.md");
        testFs.removeRoot();

        expect(events).toEqual([
            { kind: "changed", paths: ["a.md"] },
            { kind: "changed", paths: ["a.md"] },
            { kind: "root-lost" },
        ]);
    });

    it("persists a rename and a new folder across a reload and lists directories", async () => {
        const first = createMemoryPlatform(localStorage);
        first.testFs.seedWorkspace(ROOT, { "a.md": "# A", "d/b.md": "# B" });
        const fs = await openRoot(first.platform);
        await fs.mkdir("empty" as never);
        const renamed = await fs.rename("a.md" as never, "d/c.md" as never);

        const second = createMemoryPlatform(localStorage);
        await openRoot(second.platform);

        expect(renamed.ok).toBe(true);
        expect(second.testFs.listFiles()).toEqual(["d/b.md", "d/c.md"]);
        expect(second.testFs.listDirectories()).toEqual(["d", "empty"]);
    });

    it("refuses a rename in a read-only workspace and keeps the file", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, { "a.md": "x" });
        const fs = await openRoot(platform);
        testFs.setReadOnly(true);

        const result = await fs.rename("a.md" as never, "b.md" as never);

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("permission-denied");
        expect(testFs.listFiles()).toEqual(["a.md"]);
    });

    it("exposes the exact saved bytes", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, {});
        const fs = await openRoot(platform);
        await fs.writeTextAtomic("n.md" as never, "café\r\n");

        expect(Array.from(testFs.readBytes("n.md") ?? [])).toEqual(
            Array.from(bytes("café\r\n")),
        );
        expect(testFs.readBytes("missing.md")).toBeNull();
    });

    it("seeds raw bytes, including invalid UTF-8", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, { "bad.md": new Uint8Array([0xff, 0xfe]) });
        const fs = await openRoot(platform);
        const result = await fs.readText("bad.md" as never);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("not-utf8");
    });

    it("returns the chosen picker result and cancels on null", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.setPickerResult(ROOT);
        expect(await platform.picker.pickDirectory()).toEqual({
            ok: true,
            value: ROOT,
        });
        testFs.setPickerResult(null);
        expect(await platform.picker.pickDirectory()).toEqual({
            ok: true,
            value: null,
        });
    });

    it("defaults the picker to a seeded demo workspace with nested and non-Markdown files", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        const picked = await platform.picker.pickDirectory();
        expect(picked).toEqual({ ok: true, value: DEMO_WORKSPACE_ROOT });

        const opened = await platform.access.open(DEMO_WORKSPACE_ROOT as never);
        expect(opened.ok).toBe(true);
        const files = testFs.listFiles();
        expect(files).toContain("projects/Roadmap.md");
        expect(files).toContain("attachments/readme.txt");
        expect(files.filter((file) => file.endsWith(".md")).length).toBe(3);
    });

    it("restores the demo default when the picker result is reset to undefined", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.setPickerResult(null);
        testFs.setPickerResult(undefined);
        expect(await platform.picker.pickDirectory()).toEqual({
            ok: true,
            value: DEMO_WORKSPACE_ROOT,
        });
    });

    it("does not overwrite an existing demo workspace when picking again", async () => {
        const first = createMemoryPlatform(localStorage);
        await first.platform.picker.pickDirectory();
        const fs = await first.platform.access.open(
            DEMO_WORKSPACE_ROOT as never,
        );
        if (!fs.ok) throw new Error("demo missing");
        await fs.value.writeTextAtomic("mine.md" as never, "keep");

        const second = createMemoryPlatform(localStorage);
        await second.platform.picker.pickDirectory();
        await second.platform.access.open(DEMO_WORKSPACE_ROOT as never);

        expect(second.testFs.listFiles()).toContain("mine.md");
    });

    it("rejects opening an unknown workspace", async () => {
        const { platform } = createMemoryPlatform(localStorage);
        const result = await platform.access.open(ROOT);
        expect(result.ok).toBe(false);
    });

    it("injects a single write failure", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, {});
        const fs = await openRoot(platform);
        testFs.failNextWrite();

        expect((await fs.writeTextAtomic("a.md" as never, "1")).ok).toBe(false);
        expect((await fs.writeTextAtomic("a.md" as never, "2")).ok).toBe(true);
        expect(testFs.listFiles()).toEqual(["a.md"]);
    });

    it("applies the read-only and failWatch toggles to open workspaces", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, {});
        const fs = await openRoot(platform);

        testFs.setReadOnly(true);
        const write = await fs.writeTextAtomic("a.md" as never, "1");
        expect(!write.ok && write.error.code).toBe("permission-denied");
        testFs.setReadOnly(false);
        expect((await fs.writeTextAtomic("a.md" as never, "1")).ok).toBe(true);

        testFs.setFailWatch(true);
        expect((await fs.watch(() => undefined)).ok).toBe(false);
    });

    it("denies every operation under the scope prefix until the next pick", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, {
            "a.md": "# A",
            "attachments/x.png": "x",
            "attachments-old/y.png": "y",
        });
        testFs.setPickerResult(ROOT);
        const fs = await openRoot(platform);
        const code = (result: { ok: boolean; error?: { code: string } }) =>
            result.ok ? "ok" : result.error?.code;

        testFs.setScopeDenied("attachments");

        expect(code(await fs.readDir("attachments" as never))).toBe(
            "scope-denied",
        );
        expect(code(await fs.readBytes("attachments/x.png" as never))).toBe(
            "scope-denied",
        );
        expect(
            code(await fs.createExclusive("attachments/z.png" as never, "z")),
        ).toBe("scope-denied");
        expect(code(await fs.mkdir("attachments" as never))).toBe(
            "scope-denied",
        );
        expect(code(await fs.stat("attachments/x.png" as never))).toBe(
            "scope-denied",
        );
        expect(testFs.readBytes("attachments/z.png")).toBeNull();
        expect(code(await fs.readText("a.md" as never))).toBe("ok");
        expect(code(await fs.readBytes("attachments-old/y.png" as never))).toBe(
            "ok",
        );
        expect(code(await fs.writeTextAtomic("a.md" as never, "1"))).toBe("ok");

        await platform.picker.pickDirectory();

        expect(code(await fs.readBytes("attachments/x.png" as never))).toBe(
            "ok",
        );
        expect(
            code(await fs.createExclusive("attachments/z.png" as never, "z")),
        ).toBe("ok");
    });

    it("tolerates corrupt storage", async () => {
        localStorage.setItem(WORKSPACES_KEY, "not json");
        localStorage.setItem("basalt.memory.settings", "{broken");
        const { platform } = createMemoryPlatform(localStorage);

        expect((await platform.access.open(ROOT)).ok).toBe(false);
        expect(await platform.settings.load()).toEqual({
            ok: true,
            value: defaultAppSettings(),
        });
    });

    it("fails clearly when a handle operation needs an open workspace", () => {
        const { testFs } = createMemoryPlatform(localStorage);
        expect(() => testFs.externalDelete("a.md")).toThrow(
            "No workspace is open.",
        );
        expect(() => testFs.removeRoot()).toThrow("No workspace is open.");
    });

    it("installs the handle on the window", () => {
        const target = {} as Window;
        installMemoryPlatform(target, localStorage);
        expect(target.__basaltTestFs?.listFiles).toBeTypeOf("function");
    });

    it("keeps working in memory when the browser storage quota is exceeded", async () => {
        const { platform, testFs } = createMemoryPlatform(localStorage);
        testFs.seedWorkspace(ROOT, { "a.md": "# A" });
        const fs = await openRoot(platform);
        const setItem = vi
            .spyOn(Storage.prototype, "setItem")
            .mockImplementation(() => {
                throw new DOMException("full", "QuotaExceededError");
            });

        expect(() => {
            testFs.externalWrite("big.md", bytes("x"));
        }).not.toThrow();

        setItem.mockRestore();
        expect(Array.from(testFs.readBytes("big.md") ?? [])).toEqual([120]);
        expect((await fs.stat("big.md" as never)).ok).toBe(true);
    });
});
