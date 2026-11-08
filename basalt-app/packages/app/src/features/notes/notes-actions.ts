import {
    createAutosave,
    createNotes,
    err,
    ok,
    resolveOpenNoteChange,
    type AppError,
    type Autosave,
    type AutosaveScheduler,
    type Note,
    type NoteService,
    type Result,
    type SaveMode,
    type WorkspaceFileSystem,
    type WorkspacePath,
    type WorkspaceRoot,
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
    createNote(): Promise<Result<Note>>;
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
    readonly notes: NoteService;
};

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

function sortKey(note: Note): string {
    return note.path.slice(0, -".md".length).toLowerCase();
}

function sortNotes(notes: readonly Note[]): Note[] {
    return [...notes].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

export function createNotesActions(options: NotesActionsOptions): NotesActions {
    const { store, settings, schedule, autosaveDelayMs, untitledName } =
        options;
    const autosaves = new Map<WorkspacePath, Autosave>();
    const nextSaveModes = new Map<WorkspacePath, SaveMode>();
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
        path: WorkspacePath,
        text: string,
    ): Autosave {
        const autosave = createAutosave({
            baseText: text,
            schedule,
            delayMs: autosaveDelayMs,
            save: async (latest) => {
                const session = findSession(path);
                if (!session) return err(NO_WORKSPACE);
                const mode = nextSaveModes.get(path) ?? "normal";
                nextSaveModes.delete(path);
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
            patchSession(path, { saveStatus });
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
        autosaves.set(path, createSessionAutosave(active, path, text));
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
        const listed = await active.notes.listNotes();
        if (workspace !== active) return err(NO_WORKSPACE);
        if (!listed.ok) {
            store.setState({ listError: listed.error });
            return listed;
        }
        store.setState({ notes: sortNotes(listed.value), listError: null });
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

    async function createNoteNow(): Promise<Result<Note>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const name = active.notes.suggestNoteName(
            store.getState().notes,
            untitledName(),
        );
        const created = await active.notes.createNote(name);
        if (workspace !== active) return err(NO_WORKSPACE);
        if (!created.ok) {
            store.setState({ createError: created.error });
            return created;
        }
        store.setState((state) => ({
            notes: sortNotes([
                ...state.notes.filter(
                    (note) => note.path !== created.value.path,
                ),
                created.value,
            ]),
            createError: null,
        }));
        await openNote(created.value.path, { focus: true });
        return created;
    }

    async function saveWithMode(
        path: WorkspacePath,
        mode: SaveMode,
    ): Promise<Result<void>> {
        const autosave = autosaves.get(path);
        if (!autosave) return err(NO_WORKSPACE);
        nextSaveModes.set(path, mode);
        const result = await autosave.forceSave();
        nextSaveModes.delete(path);
        return result;
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
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const session = findSession(path);
            if (!session || session.openFailed || !autosaves.has(path)) return;
            const change = await resolveOpenNoteChange({
                notes: active.notes,
                changed,
                path,
                text: session.text,
                baseText: session.baseText,
            });
            if (workspace !== active) return;
            const fresh = findSession(path);
            if (!fresh) return;
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

    let lastCreate: Promise<unknown> = Promise.resolve();

    function createNote(): Promise<Result<Note>> {
        const run = lastCreate.then(createNoteNow);
        lastCreate = run;
        return run;
    }

    return {
        async enterWorkspace(root, fs) {
            const active = { root, notes: createNotes({ fs }) };
            workspace = active;
            store.setState(emptyNotesState());
            const listed = await refreshNotes();
            await restoreTabs(active);
            return listed;
        },
        leaveWorkspace() {
            for (const autosave of autosaves.values()) autosave.dispose();
            autosaves.clear();
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
