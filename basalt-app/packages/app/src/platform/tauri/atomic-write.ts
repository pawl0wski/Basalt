import { remove, rename, writeFile } from "@tauri-apps/plugin-fs";
import type { Result } from "@basalt/core";
import { attempt } from "./plugin-errors";

export async function writeFileAtomic(
    target: string,
    temp: string,
    bytes: Uint8Array,
): Promise<Result<void>> {
    const written = await attempt(async () => {
        await writeFile(temp, bytes);
        await rename(temp, target);
    });
    if (!written.ok) await attempt(() => remove(temp));
    return written;
}
