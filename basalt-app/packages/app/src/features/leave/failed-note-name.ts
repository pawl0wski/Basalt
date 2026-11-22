import type { NoteSession } from "../notes/notes-store";
import { isDirty } from "../notes/notes-store";
import { noteTitle } from "../editor/note-title";
import type { PendingLeave } from "./leave-store";

export function failedNoteName(
    pending: PendingLeave,
    openNotes: readonly NoteSession[],
): string {
    if (pending.kind === "close-tab" || pending.kind === "delete-folder") {
        return noteTitle(pending.path);
    }
    const failed =
        openNotes.find((note) => isDirty(note) && note.error) ??
        openNotes.find(isDirty);
    return failed ? noteTitle(failed.path) : "";
}
