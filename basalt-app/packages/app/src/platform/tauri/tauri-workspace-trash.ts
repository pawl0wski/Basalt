import type { WorkspaceRoot, WorkspaceTrash } from "@basalt/core";
import { invoke } from "@tauri-apps/api/core";
import { createNativePaths } from "./native-paths";
import { attempt } from "./plugin-errors";

export function createTauriWorkspaceTrash(root: WorkspaceRoot): WorkspaceTrash {
    const paths = createNativePaths(root);
    return {
        async moveToTrash(targets) {
            const native = targets.map((path) => paths.toNative(path));
            return attempt(() =>
                invoke<void>("move_to_trash", { paths: native }),
            );
        },
    };
}
