import type { AppError, WorkspacePath } from "@basalt/core";
import type { WindowChrome } from "../../platform/platform";
import type { NotesActions } from "../notes/notes-actions";
import type { WorkspaceActions } from "../workspace/workspace-actions";
import type { LeaveStore, PendingLeave } from "./leave-store";

export type LeaveActionsOptions = {
    readonly store: LeaveStore;
    readonly notes: NotesActions;
    readonly workspace: WorkspaceActions;
    readonly windowChrome: WindowChrome;
    readonly onFolderDeleted?: (path: WorkspacePath) => void;
    readonly onDeleteFailed?: (error: AppError) => void;
};

export type LeaveActions = {
    block(pending: PendingLeave, error: AppError): void;
    closeTab(path: WorkspacePath): Promise<void>;
    handleCloseRequest(): Promise<boolean>;
    retry(): Promise<void>;
    discard(): Promise<void>;
    cancel(): void;
};

export function createLeaveActions(options: LeaveActionsOptions): LeaveActions {
    const {
        store,
        notes,
        workspace,
        windowChrome,
        onFolderDeleted,
        onDeleteFailed,
    } = options;

    function block(pending: PendingLeave, error: AppError): void {
        store.setState({ pending, error });
    }

    function clear(): void {
        store.setState({ pending: null, error: null });
    }

    return {
        block,
        async closeTab(path) {
            await notes.commitTitle(path);
            const closed = await notes.closeTab(path);
            if (!closed.ok) block({ kind: "close-tab", path }, closed.error);
        },
        async handleCloseRequest() {
            await notes.commitPendingTitles();
            const flushed = await notes.flushAll();
            if (flushed.ok) return true;
            block({ kind: "close-window" }, flushed.error);
            return false;
        },
        async retry() {
            const { pending } = store.getState();
            if (!pending) return;
            if (pending.kind === "close-tab") {
                const saved = await notes.saveNow(pending.path);
                if (!saved.ok) {
                    block(pending, saved.error);
                    return;
                }
                const closed = await notes.closeTab(pending.path);
                if (!closed.ok) {
                    block(pending, closed.error);
                    return;
                }
                clear();
                await workspace.retryLost();
                return;
            }
            const flushed = await notes.retryAll();
            if (!flushed.ok) {
                block(pending, flushed.error);
                return;
            }
            if (pending.kind === "delete-folder") {
                const deleted = await notes.deleteFolder(pending.path);
                if (!deleted.ok) {
                    if (deleted.error.detail?.kind === "flush-failed") {
                        block(pending, deleted.error);
                        return;
                    }
                    clear();
                    onDeleteFailed?.(deleted.error);
                    return;
                }
                clear();
                onFolderDeleted?.(pending.path);
                return;
            }
            clear();
            switch (pending.kind) {
                case "change-workspace":
                    await workspace.retryLost();
                    await workspace.continueOpen({ discard: false });
                    return;
                case "workspace-lost":
                    await workspace.retryLost();
                    return;
                case "close-window":
                    windowChrome.destroy();
                    return;
            }
        },
        async discard() {
            const { pending } = store.getState();
            if (!pending) return;
            clear();
            switch (pending.kind) {
                case "close-tab":
                    await notes.closeTab(pending.path, { discard: true });
                    return;
                case "delete-folder": {
                    const deleted = await notes.deleteFolder(pending.path, {
                        discard: true,
                    });
                    if (deleted.ok) onFolderDeleted?.(pending.path);
                    else onDeleteFailed?.(deleted.error);
                    return;
                }
                case "change-workspace":
                    await workspace.continueOpen({ discard: true });
                    return;
                case "workspace-lost":
                    await workspace.abandonLost();
                    return;
                case "close-window":
                    windowChrome.destroy();
                    return;
            }
        },
        cancel() {
            const { pending } = store.getState();
            if (pending?.kind === "change-workspace") workspace.cancelOpen();
            clear();
        },
    };
}
