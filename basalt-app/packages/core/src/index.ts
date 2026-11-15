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
export {
    batchAffectsNoteList,
    createWorkspaceWatcher,
    resolveOpenNoteChange,
} from "./workspace-watcher";
export type {
    OpenNoteChange,
    OpenNoteChangeInput,
    WatchMode,
    WorkspaceWatcher,
    WorkspaceWatcherHandlers,
    WorkspaceWatcherOptions,
} from "./workspace-watcher";
export {
    APP_SETTINGS_VERSION,
    defaultAppSettings,
    parseAppSettings,
    parseAppSettingsText,
} from "./settings";
export { FILE_KINDS, fileKindOf } from "./file-kinds";
export type { FileKindDefinition, FileKindId } from "./file-kinds";
export {
    IMAGE_FORMATS,
    MAX_IMAGE_BYTES,
    MAX_IMAGE_PIXELS,
    detectImage,
    exceedsImageLimits,
} from "./images";
export type {
    ImageDimensions,
    ImageFormat,
    ImageFormatDefinition,
    ImageInfo,
} from "./images";
export { resolveLinkTarget } from "./links";
export type { LinkTarget } from "./links";
export { createAttachments } from "./attachments";
export type { Attachments, ReadImageResult } from "./attachments";
