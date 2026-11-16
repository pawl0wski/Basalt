import { ok, type WorkspacePicker, type WorkspaceRoot } from "@basalt/core";
import { open } from "@tauri-apps/plugin-dialog";
import { attempt } from "./plugin-errors";

export function createTauriWorkspacePicker(): WorkspacePicker {
    return {
        async pickDirectory(options) {
            const picked = await attempt(() =>
                open({
                    directory: true,
                    multiple: false,
                    recursive: true,
                    ...(options?.defaultPath === undefined
                        ? {}
                        : { defaultPath: options.defaultPath }),
                }),
            );
            if (!picked.ok) return picked;
            return ok((picked.value as WorkspaceRoot | null) ?? null);
        },
    };
}
