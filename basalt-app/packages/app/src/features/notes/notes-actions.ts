import {
    buildTree,
    createAutosave,
    createNoteOperations,
    createNotes,
    err,
    ok,
    resolveOpenNoteChange,
    toWorkspacePath,
    type AppError,
    type Autosave,
    type AutosaveScheduler,
    type Note,
    type NoteMove,
    type NoteOperations,
    type NoteService,
    type Result,
    type SaveMode,
    type TreeNode,
    type WorkspaceFileSystem,
    type WorkspacePath,
    type WorkspaceRoot,
    type WorkspaceTrash,
} from "@basalt/core";
import type { SettingsWriter } from "../settings/settings-writer";
import {
    emptyNotesState,
    isDirty,
    type NoteSession,
    type NotesStore,
} from "./notes-store";

export type NotesActionsOptions = {
    readonly store: NotesStore;
    readonly settings: SettingsWriter;
    readonly schedule: AutosaveScheduler;
    readonly autosaveDelayMs: number;
    readonly untitledName: () => string;
    readonly trash: (root: WorkspaceRoot) => WorkspaceTrash;
};

export type NotesActions = {
    enterWorkspace(
        root: WorkspaceRoot,
        fs: WorkspaceFileSystem,
    ): Promise<Result<void>>;
    leaveWorkspace(): void;
    flushAll(): Promise<Result<void>>;
    retryAll(): Promise<Result<void>>;
    refreshNotes(): Promise<Result<void>>;
    openNote(
        path: WorkspacePath,
        options?: { readonly focus?: boolean },
    ): Promise<Result<void>>;
    createNote(options?: {
        readonly folder?: WorkspacePath | null;
    }): Promise<Result<Note>>;
    createFolder(
        parent: WorkspacePath | null,
        name: string,
    ): Promise<Result<WorkspacePath>>;
    renamePath(from: WorkspacePath, to: WorkspacePath): Promise<void>;
    renameNote(
        path: WorkspacePath,
        newName: string,
    ): Promise<Result<WorkspacePath>>;
    moveNotes(
        paths: readonly WorkspacePath[],
        destinationFolder: WorkspacePath | null,
    ): Promise<Result<readonly NoteMove[]>>;
    hasUnsavedText(): boolean;
    updateText(path: WorkspacePath, text: string): void;
    saveNow(path: WorkspacePath): Promise<Result<void>>;
    reloadNote(path: WorkspacePath): Promise<Result<void>>;
    handleExternalChanges(paths: readonly WorkspacePath[]): Promise<void>;
    keepMine(path: WorkspacePath): Promise<Result<void>>;
    saveAgain(path: WorkspacePath): Promise<Result<void>>;
    closeTab(
        path: WorkspacePath,
        options?: { readonly discard?: boolean },
    ): Promise<Result<void>>;
};

type ActiveWorkspace = {
    readonly root: WorkspaceRoot;
    readonly fs: WorkspaceFileSystem;
    readonly notes: NoteService;
    readonly operations: NoteOperations;
};

type SessionTarget = { path: WorkspacePath };

const CONFLICT: AppError = {
    code: "conflict",
    message: "The note changed on disk.",
};

const NOT_FOUND: AppError = {
    code: "not-found",
    message: "The note is no longer on disk.",
};

const NO_WORKSPACE: AppError = {
    code: "unavailable",
    message: "No workspace is open.",
};

const EXTERNAL_CHECK_ATTEMPTS = 4;

function flattenNotes(nodes: readonly TreeNode[]): Note[] {
    return nodes.flatMap((node) =>
        node.kind === "folder"
            ? flattenNotes(node.children)
            : [{ path: node.path, name: node.name }],
    );
}

export function createNotesActions(options: NotesActionsOptions): NotesActions {
    const { store, settings, schedule, autosaveDelayMs, untitledName } =
        options;
    const autosaves = new Map<WorkspacePath, Autosave>();
    const targets = new Map<WorkspacePath, SessionTarget>();
    const busy = new Set<WorkspacePath>();
    let workspace: ActiveWorkspace | null = null;

    function findSession(path: WorkspacePath): NoteSession | undefined {
        return store.getState().openNotes.find((note) => note.path === path);
    }

    function patchSession(
        path: WorkspacePath,
        patch: Partial<NoteSession>,
    ): void {
        store.setState((state) => ({
            openNotes: state.openNotes.map((note) =>
                note.path === path ? { ...note, ...patch } : note,
            ),
        }));
    }

    async function persistTabs(): Promise<void> {
        if (!workspace) return;
        const { root } = workspace;
        const { openNotes, activeNote } = store.getState();
        const paths = openNotes.map((note) => note.path);
        await settings.update((current) => ({
            ...current,
            workspaces: {
                ...current.workspaces,
                [root]: { openNotes: paths, activeNote },
            },
        }));
    }

    function createSessionAutosave(
        active: ActiveWorkspace,
        target: SessionTarget,
        text: string,
    ): Autosave {
        const autosave = createAutosave({
            baseText: text,
            schedule,
            delayMs: autosaveDelayMs,
            save: async (latest, mode) => {
                const path = target.path;
                const session = findSession(path);
                if (!session) return err(NO_WORKSPACE);
                const saved = await active.notes.saveNote({
                    path,
                    text: latest,
                    baseText: session.baseText,
                    eol: session.eol,
                    bom: session.bom,
                    mode,
                });
                if (!saved.ok) {
                    patchSession(path, { error: saved.error });
                    return saved;
                }
                patchSession(path, {
                    baseText: saved.value.baseText,
                    error: null,
                });
                return ok(undefined);
            },
        });
        autosave.onStatus((saveStatus) => {
            patchSession(target.path, { saveStatus });
        });
        return autosave;
    }

    async function addSession(
        active: ActiveWorkspace,
        path: WorkspacePath,
    ): Promise<Result<void>> {
        const opened = await active.notes.openNote(path);
        if (workspace !== active) return err(NO_WORKSPACE);
        if (findSession(path)) return ok(undefined);
        if (!opened.ok) {
            if (opened.error.code === "not-found") return opened;
            const failed: NoteSession = {
                path,
                text: "",
                baseText: "",
                eol: "lf",
                bom: false,
                error: opened.error,
                openFailed: true,
                saveStatus: "saved",
            };
            store.setState((state) => ({
                openNotes: [...state.openNotes, failed],
            }));
            return opened;
        }
        const { text, eol, bom } = opened.value;
        const target: SessionTarget = { path };
        targets.set(path, target);
        autosaves.set(path, createSessionAutosave(active, target, text));
        const session: NoteSession = {
            path,
            text,
            baseText: text,
            eol,
            bom,
            error: null,
            openFailed: false,
            saveStatus: "saved",
        };
        store.setState((state) => ({
            openNotes: [...state.openNotes, session],
        }));
        return ok(undefined);
    }

    async function restoreTabs(active: ActiveWorkspace): Promise<void> {
        const saved = (await settings.read())?.workspaces[active.root];
        if (!saved) return;
        for (const path of saved.openNotes) await addSession(active, path);
        if (workspace !== active) return;
        const { openNotes } = store.getState();
        const wanted = openNotes.find((note) => note.path === saved.activeNote);
        store.setState({
            activeNote: (wanted ?? openNotes[0])?.path ?? null,
        });
        await persistTabs();
    }

    async function refreshNotes(): Promise<Result<void>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const listed = await active.fs.list();
        if (workspace !== active) return err(NO_WORKSPACE);
        if (!listed.ok) {
            store.setState({ listError: listed.error });
            return listed;
        }
        const tree = buildTree(listed.value);
        store.setState({
            tree,
            notes: flattenNotes(tree),
            listError: null,
        });
        return ok(undefined);
    }

    async function openNote(
        path: WorkspacePath,
        openOptions?: { readonly focus?: boolean },
    ): Promise<Result<void>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        let result: Result<void> = ok(undefined);
        if (!findSession(path)) {
            result = await addSession(active, path);
            if (!findSession(path)) return result;
        }
        const previous = store.getState().activeNote;
        const leaving = previous === null ? undefined : findSession(previous);
        if (previous !== path && leaving && isDirty(leaving)) {
            void autosaves.get(leaving.path)?.flush();
        }
        store.setState((state) => ({
            activeNote: path,
            focusRequest:
                openOptions?.focus && !findSession(path)?.openFailed
                    ? {
                          path,
                          id: (state.focusRequest?.id ?? 0) + 1,
                      }
                    : state.focusRequest,
        }));
        await persistTabs();
        return result;
    }

    async function createNoteNow(
        folder: WorkspacePath | null,
    ): Promise<Result<Note>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const name = active.notes.suggestNoteName(
            store.getState().notes,
            untitledName(),
            folder,
        );
        const created = await active.notes.createNote(name, folder);
        if (workspace !== active) return err(NO_WORKSPACE);
        if (!created.ok) {
            store.setState({ createError: created.error });
            return created;
        }
        store.setState({ createError: null });
        await refreshNotes();
        if (workspace !== active) return err(NO_WORKSPACE);
        await openNote(created.value.path, { focus: true });
        return created;
    }

    async function saveWithMode(
        path: WorkspacePath,
        mode: SaveMode,
    ): Promise<Result<void>> {
        const autosave = autosaves.get(path);
        if (!autosave) return err(NO_WORKSPACE);
        return autosave.forceSave(mode);
    }

    function pauseWithError(path: WorkspacePath, error: AppError): void {
        if (findSession(path)?.error?.code === error.code) return;
        patchSession(path, { error });
        autosaves.get(path)?.pause(error);
    }

    async function checkExternalChange(
        active: ActiveWorkspace,
        path: WorkspacePath,
        changed: readonly WorkspacePath[],
    ): Promise<void> {
        for (let attempt = 0; attempt < EXTERNAL_CHECK_ATTEMPTS; attempt += 1) {
            const session = findSession(path);
            if (!session || session.openFailed || !autosaves.has(path)) return;
            if (busy.has(path)) return;
            const change = await resolveOpenNoteChange({
                notes: active.notes,
                changed,
                path,
                text: session.text,
                baseText: session.baseText,
            });
            if (workspace !== active) return;
            const fresh = findSession(path);
            if (!fresh || busy.has(path)) return;
            if (
                fresh.text !== session.text ||
                fresh.baseText !== session.baseText
            ) {
                continue;
            }
            switch (change.kind) {
                case "ignore":
                    return;
                case "reload":
                    patchSession(path, {
                        text: change.text,
                        baseText: change.baseText,
                        eol: change.eol,
                        bom: change.bom,
                        error: null,
                    });
                    autosaves.get(path)?.rebase(change.text);
                    return;
                case "conflict":
                    pauseWithError(path, CONFLICT);
                    return;
                case "not-found":
                    pauseWithError(path, NOT_FOUND);
                    return;
                case "error":
                    pauseWithError(path, change.error);
                    return;
            }
        }
    }

    function applyPathChange(from: WorkspacePath, to: WorkspacePath): void {
        if (from === to) return;
        const autosave = autosaves.get(from);
        const target = targets.get(from);
        if (autosave && target) {
            target.path = to;
            autosaves.delete(from);
            targets.delete(from);
            autosaves.set(to, autosave);
            targets.set(to, target);
        }
        store.setState((state) => ({
            openNotes: state.openNotes.map((note) =>
                note.path === from ? { ...note, path: to } : note,
            ),
            activeNote: state.activeNote === from ? to : state.activeNote,
            focusRequest:
                state.focusRequest?.path === from
                    ? { ...state.focusRequest, path: to }
                    : state.focusRequest,
        }));
    }

    async function renamePath(
        from: WorkspacePath,
        to: WorkspacePath,
    ): Promise<void> {
        applyPathChange(from, to);
        await persistTabs();
    }

    async function flushBeforeChange(
        paths: readonly WorkspacePath[],
    ): Promise<Result<void>> {
        for (const path of paths) {
            const autosave = autosaves.get(path);
            if (!autosave) continue;
            const saved = await autosave.forceSave();
            if (!saved.ok) return saved;
        }
        return ok(undefined);
    }

    async function withBusy<T>(
        paths: readonly WorkspacePath[],
        run: () => Promise<T>,
    ): Promise<T> {
        for (const path of paths) busy.add(path);
        try {
            return await run();
        } finally {
            for (const path of paths) busy.delete(path);
        }
    }

    async function renameNote(
        path: WorkspacePath,
        newName: string,
    ): Promise<Result<WorkspacePath>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const flushed = await flushBeforeChange([path]);
        if (!flushed.ok) return flushed;
        if (workspace !== active) return err(NO_WORKSPACE);
        const directory = path.slice(0, path.lastIndexOf("/") + 1);
        const expected = toWorkspacePath(`${directory}${newName}.md`);
        const watched = expected.ok ? [path, expected.value] : [path];
        const renamed = await withBusy(watched, async () => {
            const result = await active.operations.renameNote({
                path,
                newName,
            });
            if (result.ok && workspace === active) {
                applyPathChange(path, result.value.path);
            }
            return result;
        });
        if (!renamed.ok) return renamed;
        if (workspace !== active) return err(NO_WORKSPACE);
        await persistTabs();
        await refreshNotes();
        return ok(renamed.value.path);
    }

    async function moveNotes(
        paths: readonly WorkspacePath[],
        destinationFolder: WorkspacePath | null,
    ): Promise<Result<readonly NoteMove[]>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const flushed = await flushBeforeChange(paths);
        if (!flushed.ok) {
            store.setState({ createError: flushed.error });
            return flushed;
        }
        if (workspace !== active) return err(NO_WORKSPACE);
        const prefix =
            destinationFolder === null ? "" : `${destinationFolder}/`;
        const watched = paths.flatMap((path) => {
            const target = toWorkspacePath(
                prefix + path.slice(path.lastIndexOf("/") + 1),
            );
            return target.ok ? [path, target.value] : [path];
        });
        const moved = await withBusy(watched, async () => {
            const result = await active.operations.moveNotes({
                paths,
                destinationFolder,
                onMoved(move) {
                    if (workspace === active)
                        applyPathChange(move.from, move.to);
                },
            });
            return result;
        });
        if (workspace !== active) return err(NO_WORKSPACE);
        store.setState({ createError: moved.ok ? null : moved.error });
        await persistTabs();
        await refreshNotes();
        return moved.ok ? ok(moved.value.moved) : moved;
    }

    let lastCreate: Promise<unknown> = Promise.resolve();

    function createNote(createOptions?: {
        readonly folder?: WorkspacePath | null;
    }): Promise<Result<Note>> {
        const folder = createOptions?.folder ?? null;
        const run = lastCreate.then(() => createNoteNow(folder));
        lastCreate = run;
        return run;
    }

    async function createFolder(
        parent: WorkspacePath | null,
        name: string,
    ): Promise<Result<WorkspacePath>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const created = await active.operations.createFolder({ parent, name });
        if (!created.ok) return created;
        if (workspace !== active) return err(NO_WORKSPACE);
        await refreshNotes();
        return ok(created.value.path);
    }

    return {
        async enterWorkspace(root, fs) {
            const active = {
                root,
                fs,
                notes: createNotes({ fs }),
                operations: createNoteOperations({ fs, trash: options.trash(root) }),
            };
            workspace = active;
            store.setState(emptyNotesState());
            const listed = await refreshNotes();
            await restoreTabs(active);
            return listed;
        },
        leaveWorkspace() {
            for (const autosave of autosaves.values()) autosave.dispose();
            autosaves.clear();
            targets.clear();
            busy.clear();
            workspace = null;
            store.setState(emptyNotesState());
        },
        async flushAll() {
            const dirty = store.getState().openNotes.filter(isDirty);
            const results = await Promise.all(
                dirty.map((note) => autosaves.get(note.path)?.flush()),
            );
            for (const result of results) {
                if (result && !result.ok) return result;
            }
            return ok(undefined);
        },
        async retryAll() {
            const dirty = store.getState().openNotes.filter(isDirty);
            const results = await Promise.all(
                dirty.map((note) => {
                    const autosave = autosaves.get(note.path);
                    if (!autosave) return undefined;
                    return autosave.getError()
                        ? autosave.resume()
                        : autosave.flush();
                }),
            );
            for (const result of results) {
                if (result && !result.ok) return result;
            }
            return ok(undefined);
        },
        refreshNotes,
        openNote,
        createNote,
        createFolder,
        renamePath,
        renameNote,
        moveNotes,
        hasUnsavedText() {
            return store.getState().openNotes.some(isDirty);
        },
        updateText(path, text) {
            const session = findSession(path);
            const autosave = autosaves.get(path);
            if (!session || !autosave || session.text === text) return;
            patchSession(path, { text });
            autosave.change(text);
        },
        async saveNow(path) {
            const autosave = autosaves.get(path);
            if (!autosave) return err(NO_WORKSPACE);
            return autosave.getError() ? autosave.resume() : autosave.flush();
        },
        async reloadNote(path) {
            const active = workspace;
            const autosave = autosaves.get(path);
            if (!active || !autosave) return err(NO_WORKSPACE);
            const opened = await active.notes.openNote(path);
            if (workspace !== active) return err(NO_WORKSPACE);
            if (!opened.ok) {
                patchSession(path, { error: opened.error });
                return opened;
            }
            const { text, eol, bom } = opened.value;
            patchSession(path, {
                text,
                baseText: text,
                eol,
                bom,
                error: null,
            });
            autosave.rebase(text);
            return ok(undefined);
        },
        async handleExternalChanges(paths) {
            const active = workspace;
            if (!active) return;
            await Promise.all(
                store
                    .getState()
                    .openNotes.map((session) =>
                        checkExternalChange(active, session.path, paths),
                    ),
            );
        },
        keepMine: (path) => saveWithMode(path, "overwrite"),
        saveAgain: (path) => saveWithMode(path, "recreate"),
        async closeTab(path, closeOptions) {
            const session = findSession(path);
            if (!session) return ok(undefined);
            const autosave = autosaves.get(path);
            if (autosave && isDirty(session) && !closeOptions?.discard) {
                const flushed = await autosave.flush();
                if (!flushed.ok) return flushed;
            }
            autosave?.dispose();
            autosaves.delete(path);
            targets.delete(path);
            const { openNotes, activeNote } = store.getState();
            const index = openNotes.findIndex((note) => note.path === path);
            const remaining = openNotes.filter((note) => note.path !== path);
            store.setState({
                openNotes: remaining,
                activeNote:
                    activeNote === path
                        ? ((remaining[index] ?? remaining[index - 1])?.path ??
                          null)
                        : activeNote,
            });
            await persistTabs();
            return ok(undefined);
        },
    };
}
