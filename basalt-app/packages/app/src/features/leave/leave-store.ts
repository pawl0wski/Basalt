import type { AppError, WorkspacePath } from "@basalt/core";
import { createStore, type StoreApi } from "zustand/vanilla";

export type PendingLeave =
    | { readonly kind: "close-tab"; readonly path: WorkspacePath }
    | { readonly kind: "change-workspace" }
    | { readonly kind: "workspace-lost" }
    | { readonly kind: "close-window" };

export type LeaveState = {
    readonly pending: PendingLeave | null;
    readonly error: AppError | null;
};

export type LeaveStore = StoreApi<LeaveState>;

export function createLeaveStore(): LeaveStore {
    return createStore<LeaveState>(() => ({ pending: null, error: null }));
}
