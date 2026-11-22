import type { TFunction } from "i18next";
import type { NoteSession } from "../notes/notes-store";
import { noteTitle } from "./note-title";

export function titleErrorText(t: TFunction, session: NoteSession): string {
    const failure = session.titleError;
    if (!failure) return "";
    const name = noteTitle(session.path);
    if (failure.linksFailed > 0) {
        return t("notes.titleError.links", {
            name,
            count: failure.linksFailed,
        });
    }
    switch (failure.error.code) {
        case "invalid-path":
            return t("notes.titleError.invalid", { name });
        case "already-exists":
            return t("notes.titleError.exists", { name });
        case "permission-denied":
            return t("notes.titleError.readOnly", { name });
        default:
            return t("notes.titleError.generic", {
                name,
                reason: t(`errors.${failure.error.code}`),
            });
    }
}
