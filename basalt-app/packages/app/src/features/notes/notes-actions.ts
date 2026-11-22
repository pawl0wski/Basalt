import {
    buildTree,
    createAutosave,
    createNoteOperations,
    createNotes,
    err,
    ok,
    firstHeading,
    resolveOpenNoteChange,
    rewriteLinksTo,
    setFirstHeading,
    toWorkspacePath,
    type AppError,
    type Autosave,
    type AutosaveScheduler,
    type DeleteNotesResult,
    type FolderMove,
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
import type { Feedback } from "../feedback/feedback";
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
    readonly feedback: Feedback;
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
        options?: {
            readonly focus?: boolean;
            readonly position?: number;
        },
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
    commitTitle(path: WorkspacePath): Promise<void>;
    applyTitle(
        path: WorkspacePath,
        title: string,
    ): Promise<Result<WorkspacePath>>;
    dismissTitleError(path: WorkspacePath): void;
    commitPendingTitles(): Promise<void>;
    renameFolder(
        path: WorkspacePath,
        newName: string,
    ): Promise<Result<WorkspacePath>>;
    moveFolder(
        path: WorkspacePath,
        destinationFolder: WorkspacePath | null,
    ): Promise<Result<FolderMove | null>>;
    deleteFolder(
        path: WorkspacePath,
        options?: { readonly discard?: boolean },
    ): Promise<Result<void>>;
    moveNotes(
        paths: readonly WorkspacePath[],
        destinationFolder: WorkspacePath | null,
    ): Promise<Result<readonly NoteMove[]>>;
    deleteNotes(
        paths: readonly WorkspacePath[],
    ): Promise<Result<DeleteNotesResult>>;
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

const LINKS_FAILED: AppError = {
    code: "unknown",
    message: "Some links could not be updated.",
};

function baseNameOf(path: WorkspacePath): string {
    const name = path.slice(path.lastIndexOf("/") + 1);
    return name.endsWith(".md") ? name.slice(0, -3) : name;
}

const EXTERNAL_CHECK_ATTEMPTS = 4;
const NEW_NOTE_CURSOR = 2;

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
    let nextSessionId = 1;

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
                id: nextSessionId++,
                path,
                text: "",
                baseText: "",
                eol: "lf",
                bom: false,
                error: opened.error,
                openFailed: true,
                saveStatus: "saved",
                titleError: null,
                titlePending: false,
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
            id: nextSessionId++,
            path,
            text,
            baseText: text,
            eol,
            bom,
            error: null,
            openFailed: false,
            saveStatus: "saved",
            titleError: null,
            titlePending: false,
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
        openOptions?: {
            readonly focus?: boolean;
            readonly position?: number;
        },
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
                          position: openOptions.position ?? null,
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
            options.feedback.report(created.error);
            return created;
        }
        store.setState({ createError: null });
        await refreshNotes();
        if (workspace !== active) return err(NO_WORKSPACE);
        await openNote(created.value.path, {
            focus: true,
            position: NEW_NOTE_CURSOR,
        });
        patchSession(created.value.path, { titlePending: true });
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

    function setText(path: WorkspacePath, text: string): void {
        const session = findSession(path);
        const autosave = autosaves.get(path);
        if (!session || !autosave || session.text === text) return;
        const before = firstHeading(session.text)?.text ?? null;
        const after = firstHeading(text)?.text ?? null;
        patchSession(path, {
            text,
            ...(before !== after ? { titlePending: true } : {}),
        });
        autosave.change(text);
    }

    async function rewriteLinksAfterRename(
        oldPath: WorkspacePath,
        newPath: WorkspacePath,
    ): Promise<number> {
        const active = workspace;
        if (!active) return 0;
        const sessions = store
            .getState()
            .openNotes.filter((session) => !session.openFailed);
        for (const session of sessions) {
            const rewritten = rewriteLinksTo(
                session.text,
                session.path,
                oldPath,
                newPath,
            );
            if (rewritten !== session.text) setText(session.path, rewritten);
        }
        const result = await active.operations.rewriteIncomingLinks({
            oldPath,
            newPath,
            skip: sessions.map((session) => session.path),
        });
        if (!result.ok) return 1;
        return result.value.failed.length;
    }

    const committing = new Set<number>();

    async function commitTitle(path: WorkspacePath): Promise<void> {
        const session = findSession(path);
        if (!workspace || !session || session.openFailed) return;
        if (!session.titlePending || committing.has(session.id)) return;
        const heading = firstHeading(session.text);
        const current = baseNameOf(path);
        if (!heading) {
            patchSession(path, { titlePending: false, titleError: null });
            return;
        }
        if (heading.text === "") {
            setText(path, setFirstHeading(session.text, current));
            patchSession(path, { titlePending: false, titleError: null });
            return;
        }
        if (heading.text === current) {
            patchSession(path, { titlePending: false, titleError: null });
            return;
        }
        committing.add(session.id);
        try {
            const renamed = await renameNote(path, heading.text);
            if (!renamed.ok) {
                patchSession(path, {
                    titleError: { error: renamed.error, linksFailed: 0 },
                });
                return;
            }
            const failed = await rewriteLinksAfterRename(path, renamed.value);
            patchSession(renamed.value, {
                titlePending: false,
                titleError:
                    failed > 0
                        ? { error: LINKS_FAILED, linksFailed: failed }
                        : null,
            });
        } finally {
            committing.delete(session.id);
        }
    }

    async function applyTitle(
        path: WorkspacePath,
        title: string,
    ): Promise<Result<WorkspacePath>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const session = findSession(path);
        if (session && !session.openFailed) {
            const original = session.text;
            setText(path, setFirstHeading(original, title));
            const renamed = await renameNote(path, title);
            if (!renamed.ok) {
                setText(path, original);
                patchSession(path, { titlePending: session.titlePending });
                return renamed;
            }
            patchSession(renamed.value, { titlePending: false });
            await rewriteLinksAfterRename(path, renamed.value);
            return renamed;
        }
        const flushed = await flushBeforeChange([path]);
        if (!flushed.ok) return flushed;
        const directory = path.slice(0, path.lastIndexOf("/") + 1);
        const expected = toWorkspacePath(`${directory}${title}.md`);
        const watched = expected.ok ? [path, expected.value] : [path];
        const renamed = await withBusy(watched, () =>
            active.operations.renameNoteByTitle({ path, title }),
        );
        if (!renamed.ok) return renamed;
        if (workspace !== active) return err(NO_WORKSPACE);
        if (findSession(path)) applyPathChange(path, renamed.value.path);
        await persistTabs();
        await refreshNotes();
        await rewriteLinksAfterRename(path, renamed.value.path);
        return ok(renamed.value.path);
    }

    async function commitPendingTitles(): Promise<void> {
        for (const session of store.getState().openNotes) {
            if (session.titlePending) await commitTitle(session.path);
        }
    }

    function sessionsUnder(folder: WorkspacePath): WorkspacePath[] {
        return store
            .getState()
            .openNotes.map((session) => session.path)
            .filter((path) => path.startsWith(`${folder}/`));
    }

    function remapUnder(
        from: WorkspacePath,
        to: WorkspacePath,
        path: WorkspacePath,
    ): WorkspacePath {
        return `${to}${path.slice(from.length)}` as WorkspacePath;
    }

    function applyFolderChange(from: WorkspacePath, to: WorkspacePath): void {
        for (const path of sessionsUnder(from)) {
            applyPathChange(path, remapUnder(from, to, path));
        }
    }

    function folderFlushError(error: AppError): AppError {
        return { ...error, detail: { kind: "flush-failed" } } as AppError;
    }

    async function renameFolder(
        path: WorkspacePath,
        newName: string,
    ): Promise<Result<WorkspacePath>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const inside = sessionsUnder(path);
        const flushed = await flushBeforeChange(inside);
        if (!flushed.ok) return flushed;
        if (workspace !== active) return err(NO_WORKSPACE);
        const directory = path.slice(0, path.lastIndexOf("/") + 1);
        const expected = toWorkspacePath(`${directory}${newName}`);
        const watched = expected.ok
            ? [
                  ...inside,
                  ...inside.map((note) =>
                      remapUnder(path, expected.value, note),
                  ),
              ]
            : inside;
        const renamed = await withBusy(watched, async () => {
            const result = await active.operations.renameFolder({
                path,
                newName,
            });
            if (result.ok && workspace === active) {
                applyFolderChange(path, result.value.path);
            }
            return result;
        });
        if (!renamed.ok) return renamed;
        if (workspace !== active) return err(NO_WORKSPACE);
        await persistTabs();
        await refreshNotes();
        return ok(renamed.value.path);
    }

    async function moveFolder(
        path: WorkspacePath,
        destinationFolder: WorkspacePath | null,
    ): Promise<Result<FolderMove | null>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const inside = sessionsUnder(path);
        const flushed = await flushBeforeChange(inside);
        if (!flushed.ok) {
            store.setState({ createError: flushed.error });
            return flushed;
        }
        if (workspace !== active) return err(NO_WORKSPACE);
        const prefix =
            destinationFolder === null ? "" : `${destinationFolder}/`;
        const expected = toWorkspacePath(
            prefix + path.slice(path.lastIndexOf("/") + 1),
        );
        const watched = expected.ok
            ? [
                  ...inside,
                  ...inside.map((note) =>
                      remapUnder(path, expected.value, note),
                  ),
              ]
            : inside;
        let newPaths: WorkspacePath[] = [];
        const moved = await withBusy(watched, async () => {
            const result = await active.operations.moveFolder({
                path,
                destinationFolder,
            });
            const happened =
                (result.ok && result.value.moved !== null) ||
                (!result.ok &&
                    result.error.detail?.kind === "folder-move-stopped");
            if (happened && expected.ok && workspace === active) {
                applyFolderChange(path, expected.value);
                newPaths = inside.map((note) =>
                    remapUnder(path, expected.value, note),
                );
            }
            return result;
        });
        if (workspace !== active) return err(NO_WORKSPACE);
        if (moved.ok) store.setState({ createError: null });
        else options.feedback.report(moved.error);
        await persistTabs();
        await refreshNotes();
        if (newPaths.length > 0) await handleExternalChangesFor(newPaths);
        return moved.ok ? ok(moved.value.moved) : moved;
    }

    async function handleExternalChangesFor(
        paths: readonly WorkspacePath[],
    ): Promise<void> {
        const active = workspace;
        if (!active) return;
        await Promise.all(
            paths.map((path) => checkExternalChange(active, path, paths)),
        );
    }

    async function deleteFolder(
        path: WorkspacePath,
        deleteOptions?: { readonly discard?: boolean },
    ): Promise<Result<void>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const inside = sessionsUnder(path);
        if (!deleteOptions?.discard) {
            const flushed = await flushBeforeChange(inside);
            if (!flushed.ok) return err(folderFlushError(flushed.error));
        }
        if (workspace !== active) return err(NO_WORKSPACE);
        const deleted = await active.operations.deleteFolder({ path });
        if (workspace !== active) return err(NO_WORKSPACE);
        if (!deleted.ok) return deleted;
        for (const note of inside) {
            await closeTab(note, { discard: true });
        }
        await refreshNotes();
        return ok(undefined);
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
        if (moved.ok) store.setState({ createError: null });
        else options.feedback.report(moved.error);
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

    async function closeTab(
        path: WorkspacePath,
        closeOptions?: { readonly discard?: boolean },
    ): Promise<Result<void>> {
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
                    ? ((remaining[index] ?? remaining[index - 1])?.path ?? null)
                    : activeNote,
        });
        await persistTabs();
        return ok(undefined);
    }

    async function deleteNotes(
        paths: readonly WorkspacePath[],
    ): Promise<Result<DeleteNotesResult>> {
        const active = workspace;
        if (!active) return err(NO_WORKSPACE);
        const result = await active.operations.deleteNotes({ paths });
        if (workspace !== active) return err(NO_WORKSPACE);
        if (!result.ok) return result;
        for (const path of result.value.deleted) {
            await closeTab(path, { discard: true });
        }
        await refreshNotes();
        return result;
    }

    return {
        async enterWorkspace(root, fs) {
            const active = {
                root,
                fs,
                notes: createNotes({ fs }),
                operations: createNoteOperations({
                    fs,
                    trash: options.trash(root),
                }),
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
        updateText: setText,
        commitTitle,
        applyTitle,
        commitPendingTitles,
        renameFolder,
        moveFolder,
        deleteFolder,
        dismissTitleError(path) {
            patchSession(path, { titleError: null });
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
        closeTab,
        deleteNotes,
    };
}
