import {
    batchAffectsNoteList,
    createWorkspaceWatcher,
    ok,
    type AppError,
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
import type { WorkspaceStatus, WorkspaceStore } from "./workspace-store";

export type WorkspaceActionsOptions = {
    readonly store: WorkspaceStore;
    readonly notes: NotesActions;
    readonly access: WorkspaceAccess;
    readonly picker: WorkspacePicker;
    readonly settings: SettingsWriter;
    readonly watchSchedule: AutosaveScheduler;
    readonly watchDebounceMs: number;
    readonly onFlushBlocked?: (error: AppError) => void;
};

export type WorkspaceActions = {
    openWorkspace(): Promise<Result<void>>;
    continueOpen(options: { readonly discard: boolean }): Promise<Result<void>>;
    cancelOpen(): void;
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
    let held: WorkspaceRoot | null = null;

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

    async function openRoot(
        target: WorkspaceRoot,
        previous: WorkspaceStatus,
        discard: boolean,
    ): Promise<Result<void>> {
        if (!discard) {
            const flushed = await notes.flushAll();
            if (!flushed.ok) {
                held = target;
                options.onFlushBlocked?.(flushed.error);
                return flushed;
            }
        }
        held = null;
        store.setState({ status: "opening", error: null });
        const opened = await access.open(target);
        if (!opened.ok) {
            store.setState({ status: previous, error: opened.error });
            return opened;
        }
        return enter(target, opened.value);
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
            return openRoot(picked.value, previous, false);
        },
        async continueOpen({ discard }) {
            const target = held;
            if (target === null) return ok(undefined);
            return openRoot(target, store.getState().status, discard);
        },
        cancelOpen() {
            held = null;
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
