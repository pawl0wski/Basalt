import type { AutosaveScheduler } from "@basalt/core";
import { createNotesActions } from "./features/notes/notes-actions";
import {
    createNotesStore,
    type NotesStore,
} from "./features/notes/notes-store";
import { createSettingsWriter } from "./features/settings/settings-writer";
import { createWorkspaceActions } from "./features/workspace/workspace-actions";
import {
    createWorkspaceStore,
    type WorkspaceStore,
} from "./features/workspace/workspace-store";
import type { NotesActions } from "./features/notes/notes-actions";
import type { WorkspaceActions } from "./features/workspace/workspace-actions";
import type { Platform, WindowChrome } from "./platform/platform";

export const AUTOSAVE_DELAY_MS = 1000;
export const WATCH_DEBOUNCE_MS = 300;

export type Services = {
    readonly workspaceStore: WorkspaceStore;
    readonly notesStore: NotesStore;
    readonly workspaceActions: WorkspaceActions;
    readonly notesActions: NotesActions;
    readonly windowChrome: WindowChrome;
};

export type ServicesOptions = {
    readonly untitledName: () => string;
    readonly schedule?: AutosaveScheduler;
    readonly watchSchedule?: AutosaveScheduler;
};

const timeoutScheduler: AutosaveScheduler = (run, delayMs) => {
    const id = setTimeout(run, delayMs);
    return () => {
        clearTimeout(id);
    };
};

export function createServices(
    platform: Platform,
    options: ServicesOptions,
): Services {
    const settings = createSettingsWriter(platform.settings);
    const workspaceStore = createWorkspaceStore();
    const notesStore = createNotesStore();
    const notesActions = createNotesActions({
        store: notesStore,
        settings,
        schedule: options.schedule ?? timeoutScheduler,
        autosaveDelayMs: AUTOSAVE_DELAY_MS,
        untitledName: options.untitledName,
    });
    const workspaceActions = createWorkspaceActions({
        store: workspaceStore,
        notes: notesActions,
        access: platform.access,
        picker: platform.picker,
        settings,
        watchSchedule: options.watchSchedule ?? timeoutScheduler,
        watchDebounceMs: WATCH_DEBOUNCE_MS,
    });
    return {
        workspaceStore,
        notesStore,
        workspaceActions,
        notesActions,
        windowChrome: platform.windowChrome,
    };
}
