import type {
    AppError,
    AutosaveStatus,
    Eol,
    Note,
    TreeNode,
    WorkspacePath,
} from "@basalt/core";
import { createStore, type StoreApi } from "zustand/vanilla";

export type NoteSession = {
    readonly path: WorkspacePath;
    readonly text: string;
    readonly baseText: string;
    readonly eol: Eol;
    readonly bom: boolean;
    readonly error: AppError | null;
    readonly openFailed: boolean;
    readonly saveStatus: AutosaveStatus;
};

export type FocusRequest = {
    readonly path: WorkspacePath;
    readonly id: number;
};

export type NotesState = {
    readonly notes: readonly Note[];
    readonly tree: readonly TreeNode[];
    readonly listError: AppError | null;
    readonly createError: AppError | null;
    readonly openNotes: readonly NoteSession[];
    readonly activeNote: WorkspacePath | null;
    readonly focusRequest: FocusRequest | null;
};

export type NotesStore = StoreApi<NotesState>;

export function createNotesStore(): NotesStore {
    return createStore<NotesState>(() => emptyNotesState());
}

export function emptyNotesState(): NotesState {
    return {
        notes: [],
        tree: [],
        listError: null,
        createError: null,
        openNotes: [],
        activeNote: null,
        focusRequest: null,
    };
}

export function isDirty(session: NoteSession): boolean {
    return session.text !== session.baseText;
}
