import type {
    AppSettingsStore,
    WorkspaceAccess,
    WorkspacePicker,
} from "@basalt/core";

export interface Platform {
    readonly access: WorkspaceAccess;
    readonly picker: WorkspacePicker;
    readonly settings: AppSettingsStore;
}
