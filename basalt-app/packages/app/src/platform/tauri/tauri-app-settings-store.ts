import {
    APP_SETTINGS_VERSION,
    defaultAppSettings,
    err,
    ok,
    parseAppSettingsText,
    type AppSettingsStore,
} from "@basalt/core";
import { appConfigDir, join } from "@tauri-apps/api/path";
import { mkdir, readFile } from "@tauri-apps/plugin-fs";
import { writeFileAtomic } from "./atomic-write";
import { attempt } from "./plugin-errors";

const SETTINGS_FILE = "basalt.json";

function diskVersion(bytes: Uint8Array): number {
    try {
        const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
        const version =
            typeof parsed === "object" && parsed !== null
                ? (parsed as { version?: unknown }).version
                : undefined;
        return typeof version === "number" ? version : 0;
    } catch {
        return 0;
    }
}

export function createTauriAppSettingsStore(): AppSettingsStore {
    async function locate() {
        return attempt(async () => {
            const directory = await appConfigDir();
            return { directory, file: await join(directory, SETTINGS_FILE) };
        });
    }

    return {
        async load() {
            const location = await locate();
            if (!location.ok) return err(location.error);
            const bytes = await attempt(() => readFile(location.value.file));
            if (!bytes.ok) {
                return bytes.error.code === "not-found"
                    ? ok(defaultAppSettings())
                    : err(bytes.error);
            }
            try {
                return ok(
                    parseAppSettingsText(new TextDecoder().decode(bytes.value)),
                );
            } catch {
                return ok(defaultAppSettings());
            }
        },

        async save(settings) {
            const location = await locate();
            if (!location.ok) return err(location.error);
            const { directory, file } = location.value;
            const existing = await attempt(() => readFile(file));
            if (existing.ok) {
                if (diskVersion(existing.value) > APP_SETTINGS_VERSION) {
                    return err({
                        code: "unavailable",
                        message:
                            "The settings file was written by a newer version of the app.",
                    });
                }
            } else if (existing.error.code !== "not-found") {
                return err(existing.error);
            }
            const created = await attempt(() =>
                mkdir(directory, { recursive: true }),
            );
            if (!created.ok) return err(created.error);
            return writeFileAtomic(
                file,
                `${file}.tmp`,
                new TextEncoder().encode(
                    `${JSON.stringify(settings, null, 2)}\n`,
                ),
            );
        },
    };
}
