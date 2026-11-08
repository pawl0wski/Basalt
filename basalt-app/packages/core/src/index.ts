export { APP_ERROR_CODES, err, mapError, ok } from "./result";
export type { AppError, AppErrorCode, Result } from "./result";
export {
    NOTE_NAME_ISSUES,
    pathKey,
    toWorkspacePath,
    validateNoteName,
} from "./workspace-path";
export type {
    NoteNameIssue,
    NoteNameValidation,
    WorkspacePath,
} from "./workspace-path";
export type {
    AppSettings,
    AppSettingsStore,
    FileEntry,
    FileKind,
    FileStat,
    Unwatch,
    WatchEvent,
    WorkspaceAccess,
    WorkspaceFileSystem,
    WorkspacePicker,
    WorkspaceRoot,
    WorkspaceSettings,
} from "./ports";
export { MAX_NOTE_BYTES, createNotes, isMarkdownPath } from "./notes";
export type {
    Eol,
    Note,
    NoteService,
    OpenedNote,
    SaveMode,
    SaveNoteInput,
} from "./notes";
export { createAutosave } from "./autosave";
export type {
    Autosave,
    AutosaveOptions,
    AutosaveScheduler,
    AutosaveStatus,
} from "./autosave";
