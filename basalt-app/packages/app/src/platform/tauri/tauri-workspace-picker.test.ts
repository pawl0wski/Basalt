import type { WorkspaceRoot } from "@basalt/core";
import { afterEach, expect, it } from "vitest";
import {
    installFakePluginFs,
    type FakePluginFs,
} from "./testing/fake-plugin-fs";
import { createTauriWorkspacePicker } from "./tauri-workspace-picker";

let plugin: FakePluginFs | undefined;
afterEach(() => plugin?.uninstall());

it("returns the chosen directory", async () => {
    plugin = installFakePluginFs("/ws");
    plugin.pickDirectory("/home/me/notes");

    expect(await createTauriWorkspacePicker().pickDirectory()).toEqual({
        ok: true,
        value: "/home/me/notes",
    });
});

it("returns null when the dialog is cancelled", async () => {
    plugin = installFakePluginFs("/ws");
    plugin.pickDirectory(null);

    expect(await createTauriWorkspacePicker().pickDirectory()).toEqual({
        ok: true,
        value: null,
    });
});

it("requests a recursive scope without a default path", async () => {
    plugin = installFakePluginFs("/ws");
    plugin.pickDirectory("/home/me/notes");

    await createTauriWorkspacePicker().pickDirectory();

    expect(plugin.dialogOptions).toEqual([
        { directory: true, multiple: false, recursive: true },
    ]);
});

it("passes the default path to the dialog when given", async () => {
    plugin = installFakePluginFs("/ws");
    plugin.pickDirectory("/home/me/notes");

    await createTauriWorkspacePicker().pickDirectory({
        defaultPath: "/home/me/notes" as WorkspaceRoot,
    });

    expect(plugin.dialogOptions).toEqual([
        {
            directory: true,
            multiple: false,
            recursive: true,
            defaultPath: "/home/me/notes",
        },
    ]);
});
