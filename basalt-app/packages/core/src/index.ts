export { APP_ERROR_CODES, err, mapError, ok } from "./result";
export type { AppError, AppErrorCode, AppErrorDetail, Result } from "./result";
export {
    NOTE_NAME_ISSUES,
    pathKey,
    sameWorkspaceRoot,
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
    WorkspaceTrash,
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
export {
    buildRelativeLink,
    encodeLinkSegment,
    formatImageLink,
    resolveLinkTarget,
} from "./links";
export {
    attachmentExtension,
    pastedImageBaseName,
    planAttachmentName,
    sanitizeFileName,
    splitFileName,
} from "./attachment-names";
export {
    DEFAULT_ATTACHMENT_LOCATION,
    attachmentFolderFor,
} from "./attachment-location";
export type { AttachmentLocation } from "./attachment-location";
export type { LinkTarget } from "./links";
export { createAttachments } from "./attachments";
export type {
    AddImageInput,
    AddImageResult,
    Attachments,
    ReadImageResult,
} from "./attachments";
export { HIDDEN_ROOT_FOLDERS, buildTree } from "./tree";
export type { FolderNode, NoteNode, TreeNode } from "./tree";
export { rewriteRelativeLinks } from "./link-rewrite";
export { createNoteOperations } from "./note-operations";
export { firstHeading, setFirstHeading } from "./note-heading";
export type { NoteHeading } from "./note-heading";
export { rewriteLinksTo } from "./link-rewrite";
export type {
    MoveNotesInput,
    NoteMove,
    CreateFolderInput,
    DeleteNotesInput,
    DeleteNotesResult,
    NoteDeleteFailure,
    NoteOperations,
    RenameNoteInput,
    RenameByTitleInput,
    RenameFolderInput,
    MoveFolderInput,
    FolderMove,
    RewriteIncomingLinksInput,
    RewriteIncomingLinksResult,
} from "./note-operations";

export { countWords } from "./text-stats";
