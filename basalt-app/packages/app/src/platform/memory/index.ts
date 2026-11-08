import type { Platform } from "../platform";
import { createMemoryPlatform } from "./memory-platform";

export {
    createMemoryPlatform,
    SETTINGS_KEY,
    WORKSPACES_KEY,
} from "./memory-platform";
export type { MemoryPlatform } from "./memory-platform";
export type { BasaltTestFs } from "./test-fs";

export function installMemoryPlatform(
    target: Window = window,
    storage: Storage = target.localStorage,
): Platform {
    const { platform, testFs } = createMemoryPlatform(storage);
    target.__basaltTestFs = testFs;
    return platform;
}
