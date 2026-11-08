import { describe, expect, it } from "vitest";
import {
    defaultAppSettings,
    err,
    ok,
    type AppSettings,
    type AppSettingsStore,
    type WorkspaceRoot,
} from "@basalt/core";
import { createSettingsWriter } from "./settings-writer";

function fakeStore(initial: AppSettings = defaultAppSettings()) {
    const saved: AppSettings[] = [];
    let failSave = false;
    const store: AppSettingsStore = {
        load: async () => ok(initial),
        save: async (settings) => {
            if (failSave) {
                return err({ code: "unavailable", message: "newer" });
            }
            saved.push(settings);
            return ok(undefined);
        },
    };
    return {
        store,
        saved,
        failSaves: () => {
            failSave = true;
        },
    };
}

const withLast = (path: string) => (s: AppSettings) => ({
    ...s,
    lastWorkspace: path as WorkspaceRoot,
});

describe("createSettingsWriter", () => {
    it("loads once and serves reads from the cache", async () => {
        let loads = 0;
        const writer = createSettingsWriter({
            load: async () => {
                loads += 1;
                return ok(defaultAppSettings());
            },
            save: async () => ok(undefined),
        });

        await writer.read();
        await writer.read();

        expect(loads).toBe(1);
    });

    it("saves the changed settings and caches them", async () => {
        const { store, saved } = fakeStore();
        const writer = createSettingsWriter(store);

        await writer.update(withLast("/a"));

        expect(saved).toHaveLength(1);
        expect((await writer.read())?.lastWorkspace).toBe("/a");
    });

    it("applies concurrent updates in order on top of each other", async () => {
        const { store, saved } = fakeStore();
        const writer = createSettingsWriter(store);

        await Promise.all([
            writer.update(withLast("/a")),
            writer.update((s) => ({ ...s, workspaces: { "/a": {} } as never })),
        ]);

        expect(saved).toHaveLength(2);
        expect(saved[1].lastWorkspace).toBe("/a");
    });

    it("does not cache a value that failed to save", async () => {
        const { store, failSaves } = fakeStore();
        const writer = createSettingsWriter(store);
        await writer.read();
        failSaves();

        await writer.update(withLast("/unsaved"));

        expect((await writer.read())?.lastWorkspace).toBe(
            defaultAppSettings().lastWorkspace,
        );
    });

    it("does nothing when settings cannot be loaded", async () => {
        let saves = 0;
        const writer = createSettingsWriter({
            load: async () => err({ code: "unavailable", message: "x" }),
            save: async () => {
                saves += 1;
                return ok(undefined);
            },
        });

        await writer.update(withLast("/a"));

        expect(saves).toBe(0);
        expect(await writer.read()).toBeNull();
    });
});
