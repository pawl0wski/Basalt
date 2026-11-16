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
    sameWorkspaceRoot,
    type WorkspaceRoot,
} from "@basalt/core";
import type { ImageHub } from "../attachments/image-hub";
import type { NotesActions } from "../notes/notes-actions";
import type { SettingsWriter } from "../settings/settings-writer";
import { withScopeReporting } from "./scope-reporting-fs";
import type { WorkspaceStatus, WorkspaceStore } from "./workspace-store";

export type WorkspaceActionsOptions = {
    readonly store: WorkspaceStore;
    readonly notes: NotesActions;
    readonly access: WorkspaceAccess;
    readonly picker: WorkspacePicker;
    readonly settings: SettingsWriter;
    readonly watchSchedule: AutosaveScheduler;
    readonly watchDebounceMs: number;
    readonly images?: ImageHub;
    readonly onFlushBlocked?: (error: AppError) => void;
    readonly onWorkspaceLost?: (error: AppError) => void;
};

export type WorkspaceActions = {
    openWorkspace(): Promise<Result<void>>;
    continueOpen(options: { readonly discard: boolean }): Promise<Result<void>>;
    cancelOpen(): void;
    regrantAccess(): Promise<Result<void>>;
    restoreWorkspace(): Promise<void>;
    leaveWorkspace(): Promise<void>;
    refreshOnFocus(): Promise<void>;
    handleWorkspaceLost(): Promise<void>;
    retryLost(): Promise<Result<void>>;
    abandonLost(): Promise<void>;
};

export function createWorkspaceActions(
    options: WorkspaceActionsOptions,
): WorkspaceActions {
    const { store, notes, access, picker, settings } = options;
    let watcher: WorkspaceWatcher | null = null;
    let held: WorkspaceRoot | null = null;
    let currentFs: WorkspaceFileSystem | null = null;
    let opening = false;

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
                if (watcher === current) options.images?.notifyChanged(paths);
                void notes.handleExternalChanges(paths);
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
        currentFs = null;
        options.images?.setFs(null);
        store.setState({
            root: null,
            status: "welcome",
            error: null,
            watchMode: "live",
            unavailable: false,
            accessNeeded: false,
        });
    }

    async function abandonLost(): Promise<void> {
        await leaveWorkspace();
        store.setState({ notice: "workspace-unavailable" });
    }

    async function handleWorkspaceLost(): Promise<void> {
        const { status, unavailable } = store.getState();
        if (status !== "open" || unavailable) return;
        if (!notes.hasUnsavedText()) {
            await abandonLost();
            return;
        }
        store.setState({ unavailable: true });
        const flushed = await notes.flushAll();
        if (flushed.ok) {
            if (store.getState().unavailable) await abandonLost();
            return;
        }
        options.onWorkspaceLost?.(flushed.error);
    }

    async function retryLost(): Promise<Result<void>> {
        const fs = currentFs;
        if (!store.getState().unavailable || !fs) return ok(undefined);
        const probed = await notes.refreshNotes();
        if (!probed.ok) {
            if (!notes.hasUnsavedText()) {
                await abandonLost();
                return probed;
            }
            options.onWorkspaceLost?.(probed.error);
            return probed;
        }
        const flushed = await notes.retryAll();
        if (!flushed.ok) {
            options.onWorkspaceLost?.(flushed.error);
            return flushed;
        }
        await stopWatching();
        store.setState({ unavailable: false });
        await startWatching(fs);
        return ok(undefined);
    }

    async function enter(
        root: WorkspaceRoot,
        rawFs: WorkspaceFileSystem,
    ): Promise<Result<void>> {
        await stopWatching();
        notes.leaveWorkspace();
        const fs: WorkspaceFileSystem = withScopeReporting(rawFs, () => {
            if (currentFs === fs) store.setState({ accessNeeded: true });
        });
        currentFs = fs;
        store.setState({ accessNeeded: false });
        options.images?.setFs(fs);
        await notes.enterWorkspace(root, fs);
        store.setState({
            root,
            status: "open",
            error: null,
            notice: null,
            watchMode: "live",
            unavailable: false,
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
        opening = true;
        store.setState(
            previous === "open"
                ? { error: null }
                : { status: "opening", error: null },
        );
        const opened = await access.open(target);
        if (!opened.ok) {
            opening = false;
            store.setState({ status: previous, error: opened.error });
            return opened;
        }
        const entered = await enter(target, opened.value);
        opening = false;
        return entered;
    }

    return {
        async openWorkspace() {
            const previous = store.getState().status;
            if (previous === "opening" || opening) return ok(undefined);
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
        async regrantAccess() {
            const { root, status } = store.getState();
            if (status !== "open" || root === null || opening) {
                return ok(undefined);
            }
            const picked = await picker.pickDirectory({ defaultPath: root });
            if (!picked.ok) {
                store.setState({ error: picked.error });
                return picked;
            }
            if (picked.value === null) return ok(undefined);
            if (!sameWorkspaceRoot(picked.value, root)) {
                return openRoot(picked.value, status, false);
            }
            store.setState({ accessNeeded: false, error: null });
            await notes.refreshNotes();
            await options.images?.notifyFocus();
            return ok(undefined);
        },
        leaveWorkspace,
        handleWorkspaceLost,
        retryLost,
        abandonLost,
        async refreshOnFocus() {
            const { status, watchMode } = store.getState();
            if (status !== "open" || watchMode !== "focus-fallback") return;
            await notes.refreshNotes();
            await options.images?.notifyFocus();
        },
        async restoreWorkspace() {
            if (store.getState().status !== "welcome") return;
            const root = (await settings.read())?.lastWorkspace;
            if (!root) return;
            store.setState({ status: "opening" });
            const opened = await access.open(root);
            if (!opened.ok) {
                const { code } = opened.error;
                store.setState({
                    status: "welcome",
                    notice:
                        code === "not-found"
                            ? "workspace-missing"
                            : code === "scope-denied"
                              ? "workspace-access-needed"
                              : "workspace-unavailable",
                });
                return;
            }
            await enter(root, opened.value);
        },
    };
}
