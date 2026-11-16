import { err, ok } from "../result";
import type { WorkspaceTrash } from "../ports";
import type { WorkspacePath } from "../workspace-path";

export interface InMemoryWorkspaceTrashOptions {
    readonly readOnly?: () => boolean;
}

export interface InMemoryWorkspaceTrash extends WorkspaceTrash {
    failNext(): void;
}

export function createInMemoryWorkspaceTrash(
    remove: (path: WorkspacePath) => void,
    options: InMemoryWorkspaceTrashOptions = {},
): InMemoryWorkspaceTrash {
    let shouldFail = false;
    return {
        async moveToTrash(paths) {
            if (options.readOnly?.()) {
                return err({
                    code: "permission-denied",
                    message: "The workspace is read-only.",
                });
            }
            if (shouldFail) {
                shouldFail = false;
                return err({
                    code: "unknown",
                    message: "Injected trash failure.",
                });
            }
            for (const path of paths) remove(path);
            return ok(undefined);
        },
        failNext() {
            shouldFail = true;
        },
    };
}
