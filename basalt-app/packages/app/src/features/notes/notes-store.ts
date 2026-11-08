import type {
    AppError,
    AutosaveStatus,
    Eol,
    Note,
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
    readonly saveStatus: AutosaveStatus;
};

export type NotesState = {
    readonly notes: readonly Note[];
    readonly listError: AppError | null;
    readonly openNotes: readonly NoteSession[];
    readonly activeNote: WorkspacePath | null;
};

export type NotesStore = StoreApi<NotesState>;

export function createNotesStore(): NotesStore {
    return createStore<NotesState>(() => emptyNotesState());
}

export function emptyNotesState(): NotesState {
    return { notes: [], listError: null, openNotes: [], activeNote: null };
}

export function isDirty(session: NoteSession): boolean {
    return session.text !== session.baseText;
}
