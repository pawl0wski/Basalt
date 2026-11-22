import type { AutosaveScheduler } from "@basalt/core";
import { createFeedback } from "./features/feedback/feedback";
import {
    createFeedbackStore,
    type FeedbackStore,
} from "./features/feedback/feedback-store";
import { createNotesActions } from "./features/notes/notes-actions";
import {
    createNotesStore,
    type NotesStore,
} from "./features/notes/notes-store";
import {
    createLeaveActions,
    type LeaveActions,
} from "./features/leave/leave-actions";
import {
    createLeaveStore,
    type LeaveStore,
} from "./features/leave/leave-store";
import {
    createImageHub,
    type ImageHub,
} from "./features/attachments/image-hub";
import {
    createTreeStore,
    emptyTreeState,
    prunePaths,
    type TreeStore,
} from "./features/tree/tree-store";
import {
    createTreeActions,
    type TreeActions,
} from "./features/tree/tree-actions";
import { connectTreeStore } from "./features/tree/tree-wiring";
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
    readonly treeStore: TreeStore;
    readonly treeActions: TreeActions;
    readonly workspaceActions: WorkspaceActions;
    readonly notesActions: NotesActions;
    readonly leaveStore: LeaveStore;
    readonly leaveActions: LeaveActions;
    readonly windowChrome: WindowChrome;
    readonly images: ImageHub;
    readonly feedbackStore: FeedbackStore;
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
    const treeStore = createTreeStore();
    connectTreeStore({ tree: treeStore, notes: notesStore });
    const feedbackStore = createFeedbackStore();
    const feedback = createFeedback({
        store: feedbackStore,
        setPersistent: (error) => {
            notesStore.setState({ createError: error });
        },
    });
    const notesActions = createNotesActions({
        store: notesStore,
        settings,
        schedule: options.schedule ?? timeoutScheduler,
        autosaveDelayMs: AUTOSAVE_DELAY_MS,
        untitledName: options.untitledName,
        trash: platform.trash,
        feedback,
    });
    const leaveStore = createLeaveStore();
    const treeActions = createTreeActions({
        store: treeStore,
        notesStore,
        notes: notesActions,
        feedback,
        onDeleteFolderBlocked: (path, error) => {
            leaveStore.setState({
                pending: { kind: "delete-folder", path },
                error,
            });
        },
    });
    const images = createImageHub();
    const workspaceActions = createWorkspaceActions({
        store: workspaceStore,
        notes: notesActions,
        access: platform.access,
        picker: platform.picker,
        settings,
        images,
        watchSchedule: options.watchSchedule ?? timeoutScheduler,
        watchDebounceMs: WATCH_DEBOUNCE_MS,
        onWorkspaceReset: () => {
            treeStore.setState(emptyTreeState());
        },
        onFlushBlocked: (error) => {
            leaveStore.setState({
                pending: { kind: "change-workspace" },
                error,
            });
        },
        onWorkspaceLost: (error) => {
            if (leaveStore.getState().pending) return;
            leaveStore.setState({ pending: { kind: "workspace-lost" }, error });
        },
    });
    const leaveActions = createLeaveActions({
        store: leaveStore,
        notes: notesActions,
        workspace: workspaceActions,
        windowChrome: platform.windowChrome,
        onFolderDeleted: (path) => {
            prunePaths(treeStore, path);
        },
        onDeleteFailed: (error) => {
            feedback.report(error);
        },
    });
    return {
        workspaceStore,
        notesStore,
        treeStore,
        treeActions,
        workspaceActions,
        notesActions,
        leaveStore,
        leaveActions,
        windowChrome: platform.windowChrome,
        images,
        feedbackStore,
    };
}
