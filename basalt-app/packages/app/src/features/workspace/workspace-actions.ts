import {
    batchAffectsNoteList,
    createWorkspaceWatcher,
    ok,
    type AutosaveScheduler,
    type Result,
    type WorkspaceWatcher,
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
    readonly watchSchedule: AutosaveScheduler;
    readonly watchDebounceMs: number;
};

export type WorkspaceActions = {
    openWorkspace(): Promise<Result<void>>;
    restoreWorkspace(): Promise<void>;
    leaveWorkspace(): Promise<void>;
    refreshOnFocus(): Promise<void>;
    handleWorkspaceLost(): Promise<void>;
};

export function createWorkspaceActions(
    options: WorkspaceActionsOptions,
): WorkspaceActions {
    const { store, notes, access, picker, settings } = options;
    let watcher: WorkspaceWatcher | null = null;

    async function stopWatching(): Promise<void> {
        const current = watcher;
        watcher = null;
        await current?.stop();
    }

    async function startWatching(fs: WorkspaceFileSystem): Promise<void> {
        const current = createWorkspaceWatcher({
            fs,
            schedule: options.watchSchedule,
            debounceMs: options.watchDebounceMs,
        });
        watcher = current;
        const watchMode = await current.start({
            onBatch(paths) {
                void batchAffectsNoteList(fs, paths).then((affects) => {
                    if (affects && watcher === current) {
                        void notes.refreshNotes();
                    }
                });
            },
            onRootLost() {
                if (watcher === current) void handleWorkspaceLost();
            },
        });
        if (watcher === current) store.setState({ watchMode });
    }

    async function leaveWorkspace(): Promise<void> {
        await stopWatching();
        notes.leaveWorkspace();
        store.setState({
            root: null,
            status: "welcome",
            error: null,
            watchMode: "live",
        });
    }

    async function handleWorkspaceLost(): Promise<void> {
        if (notes.hasUnsavedText()) return;
        await leaveWorkspace();
        store.setState({ notice: "workspace-unavailable" });
    }

    async function enter(
        root: WorkspaceRoot,
        fs: WorkspaceFileSystem,
    ): Promise<Result<void>> {
        const flushed = await notes.flushAll();
        if (!flushed.ok) return flushed;
        await stopWatching();
        notes.leaveWorkspace();
        await notes.enterWorkspace(root, fs);
        store.setState({
            root,
            status: "open",
            error: null,
            notice: null,
            watchMode: "live",
        });
        await startWatching(fs);
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
        leaveWorkspace,
        handleWorkspaceLost,
        async refreshOnFocus() {
            const { status, watchMode } = store.getState();
            if (status !== "open" || watchMode !== "focus-fallback") return;
            await notes.refreshNotes();
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
