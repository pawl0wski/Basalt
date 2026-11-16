import type { AppError, WatchMode, WorkspaceRoot } from "@basalt/core";
import { createStore, type StoreApi } from "zustand/vanilla";

export type WorkspaceStatus = "welcome" | "opening" | "open";

export type WorkspaceNotice =
    "workspace-missing" | "workspace-unavailable" | "workspace-access-needed";

export type WorkspaceState = {
    readonly root: WorkspaceRoot | null;
    readonly status: WorkspaceStatus;
    readonly error: AppError | null;
    readonly notice: WorkspaceNotice | null;
    readonly watchMode: WatchMode;
    readonly unavailable: boolean;
    readonly accessNeeded: boolean;
};

export type WorkspaceStore = StoreApi<WorkspaceState>;

export function createWorkspaceStore(): WorkspaceStore {
    return createStore<WorkspaceState>(() => ({
        root: null,
        status: "welcome",
        error: null,
        notice: null,
        watchMode: "live",
        unavailable: false,
        accessNeeded: false,
    }));
}
