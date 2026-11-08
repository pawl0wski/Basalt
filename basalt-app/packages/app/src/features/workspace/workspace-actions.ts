import {
    ok,
    type Result,
    type WorkspaceAccess,
    type WorkspaceFileSystem,
    type WorkspacePicker,
    type WorkspaceRoot,
} from "@basalt/core";
import type { NotesActions } from "../notes/notes-actions";
import type { SettingsWriter } from "../settings/settings-writer";
import type { WorkspaceStore } from "./workspace-store";

export type WorkspaceActionsOptions = {
    readonly store: WorkspaceStore;
    readonly notes: NotesActions;
    readonly access: WorkspaceAccess;
    readonly picker: WorkspacePicker;
    readonly settings: SettingsWriter;
};

export type WorkspaceActions = {
    openWorkspace(): Promise<Result<void>>;
    restoreWorkspace(): Promise<void>;
};

export function createWorkspaceActions(
    options: WorkspaceActionsOptions,
): WorkspaceActions {
    const { store, notes, access, picker, settings } = options;

    async function enter(
        root: WorkspaceRoot,
        fs: WorkspaceFileSystem,
    ): Promise<Result<void>> {
        const flushed = await notes.flushAll();
        if (!flushed.ok) return flushed;
        notes.leaveWorkspace();
        await notes.enterWorkspace(root, fs);
        store.setState({
            root,
            status: "open",
            error: null,
            notice: null,
            watchMode: "live",
        });
        await settings.update((current) => ({
            ...current,
            lastWorkspace: root,
        }));
        return ok(undefined);
    }

    return {
        async openWorkspace() {
            const previous = store.getState().status;
            if (previous === "opening") return ok(undefined);
            const picked = await picker.pickDirectory();
            if (!picked.ok) {
                store.setState({ error: picked.error });
                return picked;
            }
            if (picked.value === null) return ok(undefined);
            store.setState({ status: "opening", error: null });
            const opened = await access.open(picked.value);
            if (!opened.ok) {
                store.setState({ status: previous, error: opened.error });
                return opened;
            }
            const entered = await enter(picked.value, opened.value);
            if (!entered.ok) store.setState({ status: previous });
            return entered;
        },
        async restoreWorkspace() {
            if (store.getState().status !== "welcome") return;
            const root = (await settings.read())?.lastWorkspace;
            if (!root) return;
            store.setState({ status: "opening" });
            const opened = await access.open(root);
            if (!opened.ok) {
                store.setState({
                    status: "welcome",
                    notice:
                        opened.error.code === "not-found"
                            ? "workspace-missing"
                            : "workspace-unavailable",
                });
                return;
            }
            await enter(root, opened.value);
        },
    };
}
