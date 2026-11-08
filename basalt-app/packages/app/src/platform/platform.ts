import type {
    AppSettingsStore,
    WorkspaceAccess,
    WorkspacePicker,
} from "@basalt/core";

export interface WindowChrome {
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    subscribeMaximized(listener: (maximized: boolean) => void): () => void;
}

export interface Platform {
    readonly access: WorkspaceAccess;
    readonly picker: WorkspacePicker;
    readonly settings: AppSettingsStore;
    readonly windowChrome: WindowChrome;
}
