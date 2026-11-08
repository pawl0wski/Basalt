import {
    createTauriAppSettingsStore,
    createTauriWorkspaceAccess,
    createTauriWorkspacePicker,
} from "./tauri";
import type { Platform } from "./platform";

export async function createPlatform(): Promise<Platform> {
    if (import.meta.env.VITE_BASALT_PLATFORM === "memory") {
        const { installMemoryPlatform } = await import("./memory");
        return installMemoryPlatform();
    }
    return {
        access: createTauriWorkspaceAccess(),
        picker: createTauriWorkspacePicker(),
        settings: createTauriAppSettingsStore(),
    };
}
