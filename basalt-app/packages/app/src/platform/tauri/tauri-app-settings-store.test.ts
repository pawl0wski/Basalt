import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
    defaultAppSettings,
    type AppSettings,
    type WorkspaceRoot,
} from "@basalt/core";
import { createTauriAppSettingsStore } from "./tauri-app-settings-store";
import {
    installFakePluginFs,
    type FakePluginFs,
} from "./testing/fake-plugin-fs";

let plugin: FakePluginFs | undefined;

function setup() {
    plugin = installFakePluginFs("/ws");
    const file = `${plugin.configDir}/basalt.json`;
    return { plugin, file, store: createTauriAppSettingsStore() };
}

afterEach(() => plugin?.uninstall());

const settings: AppSettings = {
    version: 1,
    lastWorkspace: "/ws" as WorkspaceRoot,
    workspaces: {},
};

const text = (bytes: number[] | undefined) =>
    new TextDecoder().decode(Uint8Array.from(bytes ?? []));
const decode = (bytes: number[] | undefined) =>
    JSON.parse(text(bytes)) as unknown;

describe("TauriAppSettingsStore.load", () => {
    it("returns defaults when the file does not exist", async () => {
        const { store } = setup();

        expect(await store.load()).toEqual({
            ok: true,
            value: defaultAppSettings(),
        });
    });

    it("parses the stored settings", async () => {
        const { plugin, file, store } = setup();
        plugin.seedText(file, JSON.stringify(settings));

        expect(await store.load()).toEqual({ ok: true, value: settings });
    });

    it("falls back to defaults for corrupt content and for a higher version", async () => {
        const { plugin, file, store } = setup();
        plugin.seedText(file, "{not json");
        expect(await store.load()).toEqual({
            ok: true,
            value: defaultAppSettings(),
        });

        plugin.seedText(file, JSON.stringify({ ...settings, version: 2 }));
        expect(await store.load()).toEqual({
            ok: true,
            value: defaultAppSettings(),
        });
    });

    it("reports other read failures", async () => {
        const { plugin, file, store } = setup();
        plugin.seedText(file, "{}");
        plugin.failNext("read_file", "Permission denied (os error 13)");

        const result = await store.load();

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("permission-denied");
    });
});

describe("TauriAppSettingsStore.save", () => {
    it("only touches paths covered by the capability fs scope", async () => {
        const { plugin, store } = setup();
        const capability = JSON.parse(
            readFileSync(
                resolve(process.cwd(), "src-tauri/capabilities/default.json"),
                "utf8",
            ),
        ) as { permissions: unknown[] };
        const scope = capability.permissions.find(
            (
                entry,
            ): entry is { identifier: string; allow: { path: string }[] } =>
                typeof entry === "object" &&
                entry !== null &&
                (entry as { identifier?: unknown }).identifier === "fs:scope",
        );
        const allowed = (scope?.allow ?? []).map((entry) =>
            entry.path.replace("$APPCONFIG", plugin.configDir),
        );
        const covers = (path: string) =>
            allowed.some(
                (pattern) =>
                    pattern === path ||
                    (pattern.endsWith("/*") &&
                        path.startsWith(pattern.slice(0, -1))),
            );
        const touched = new Set<string>();
        const internals = (
            window as unknown as {
                __TAURI_INTERNALS__: {
                    invoke: (
                        cmd: string,
                        args?: unknown,
                        options?: { headers?: Record<string, string> },
                    ) => Promise<unknown>;
                };
            }
        ).__TAURI_INTERNALS__;
        const original = internals.invoke;
        internals.invoke = async (cmd, args, options) => {
            const a = (args ?? {}) as {
                path?: string;
                oldPath?: string;
                newPath?: string;
            };
            const header = options?.headers?.path;
            for (const value of [
                a.path,
                a.oldPath,
                a.newPath,
                header === undefined ? undefined : decodeURIComponent(header),
            ]) {
                if (value !== undefined && cmd.startsWith("plugin:fs|")) {
                    touched.add(value);
                }
            }
            return original(cmd, args, options);
        };

        await store.save(settings);

        expect(touched.size).toBeGreaterThan(0);
        expect([...touched].filter((path) => !covers(path))).toEqual([]);
        expect(touched).toContain(plugin.configDir);
        expect(touched).toContain(`${plugin.configDir}/basalt.json.tmp`);
    });

    it("creates the config directory and writes the settings", async () => {
        const { plugin, file, store } = setup();

        const result = await store.save(settings);

        expect(result.ok).toBe(true);
        expect(plugin.entries.get(plugin.configDir)).toEqual({
            kind: "directory",
        });
        expect(decode(plugin.readBytes(file))).toEqual(settings);
        expect(plugin.entries.has(`${file}.tmp`)).toBe(false);
        expect(await store.load()).toEqual({ ok: true, value: settings });
    });

    it("overwrites a file of the same version and a corrupt file", async () => {
        const { plugin, file, store } = setup();
        plugin.seedText(file, JSON.stringify(defaultAppSettings()));
        await store.save(settings);
        expect(decode(plugin.readBytes(file))).toEqual(settings);

        plugin.seedText(file, "{not json");
        await store.save(settings);
        expect(decode(plugin.readBytes(file))).toEqual(settings);
    });

    it("does not overwrite a file written by a newer version", async () => {
        const { plugin, file, store } = setup();
        const newer = JSON.stringify({ version: 2, extra: "keep me" });
        plugin.seedText(file, newer);

        const result = await store.save(settings);

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("unavailable");
        expect(text(plugin.readBytes(file))).toBe(newer);
        expect(plugin.calls).not.toContain("write_file");
        expect(plugin.calls).not.toContain("rename");
    });

    it("keeps the previous file and removes the temp file when the write fails", async () => {
        const { plugin, file, store } = setup();
        const previous = JSON.stringify(defaultAppSettings());
        plugin.seedText(file, previous);
        plugin.failNext("rename");

        const result = await store.save(settings);

        expect(result.ok).toBe(false);
        expect(text(plugin.readBytes(file))).toBe(previous);
        expect(plugin.entries.has(`${file}.tmp`)).toBe(false);
    });

    it("does not write when the existing file cannot be read", async () => {
        const { plugin, file, store } = setup();
        plugin.seedText(file, JSON.stringify({ version: 2 }));
        plugin.failNext("read_file", "Permission denied (os error 13)");

        const result = await store.save(settings);

        expect(result.ok).toBe(false);
        expect(plugin.calls).not.toContain("write_file");
    });
});
