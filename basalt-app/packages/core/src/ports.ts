import type { Result } from "./result";
import type { WorkspacePath } from "./workspace-path";

export type WorkspaceRoot = string & { readonly __brand: "WorkspaceRoot" };

export type FileKind = "file" | "directory" | "symlink";

export interface FileEntry {
    readonly path: WorkspacePath;
    readonly kind: FileKind;
}

export interface FileStat {
    readonly kind: FileKind;
    readonly size: number;
    readonly mtimeMs: number;
}

export type WatchEvent =
    | { readonly kind: "changed"; readonly paths: readonly WorkspacePath[] }
    | { readonly kind: "root-lost" };

export type Unwatch = () => Promise<void>;

export interface WorkspaceFileSystem {
    list(): Promise<Result<readonly FileEntry[]>>;
    stat(path: WorkspacePath): Promise<Result<FileStat>>;
    readText(path: WorkspacePath): Promise<Result<string>>;
    readBytes(path: WorkspacePath): Promise<Result<Uint8Array>>;
    writeTextAtomic(path: WorkspacePath, text: string): Promise<Result<void>>;
    createExclusive(
        path: WorkspacePath,
        content: string | Uint8Array,
    ): Promise<Result<void>>;
    readDir(path: WorkspacePath): Promise<Result<readonly FileEntry[]>>;
    mkdir(path: WorkspacePath): Promise<Result<void>>;
    watch(onEvent: (event: WatchEvent) => void): Promise<Result<Unwatch>>;
}

export interface WorkspaceAccess {
    open(root: WorkspaceRoot): Promise<Result<WorkspaceFileSystem>>;
}

export interface WorkspacePicker {
    pickDirectory(options?: {
        defaultPath?: WorkspaceRoot;
    }): Promise<Result<WorkspaceRoot | null>>;
}

export interface WorkspaceSettings {
    readonly openNotes: readonly WorkspacePath[];
    readonly activeNote: WorkspacePath | null;
}

export interface AppSettings {
    readonly version: 1;
    readonly lastWorkspace: WorkspaceRoot | null;
    readonly workspaces: Readonly<Record<string, WorkspaceSettings>>;
}

export interface AppSettingsStore {
    load(): Promise<Result<AppSettings>>;
    save(settings: AppSettings): Promise<Result<void>>;
}
