import {
    err,
    ok,
    type WorkspaceAccess,
    type WorkspaceRoot,
} from "@basalt/core";
import { stat } from "@tauri-apps/plugin-fs";
import { attempt } from "./plugin-errors";
import { createTauriWorkspaceFileSystem } from "./tauri-workspace-file-system";

export function createTauriWorkspaceAccess(): WorkspaceAccess {
    return {
        async open(root: WorkspaceRoot) {
            const info = await attempt(() => stat(root));
            if (!info.ok) return err(info.error);
            if (!info.value.isDirectory) {
                return err({
                    code: "invalid-path",
                    message: "The workspace root is not a folder.",
                });
            }
            return ok(createTauriWorkspaceFileSystem(root));
        },
    };
}
