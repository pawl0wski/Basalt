import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { NoteEditor } from "./NoteEditor";
import { NoteOpenError } from "./NoteOpenError";
import { noteTitle } from "./note-title";
import { openErrorMessage } from "./open-error-message";

export function NoteEditorAreaContainer() {
    const { t } = useTranslation();
    const { notesStore, notesActions } = useServices();
    const openNotes = useStore(notesStore, (state) => state.openNotes);
    const activeNote = useStore(notesStore, (state) => state.activeNote);
    const focusRequest = useStore(notesStore, (state) => state.focusRequest);

    return (
        <>
            {openNotes.map((session) => {
                const title = noteTitle(session.path);
                return (
                    <div
                        key={session.path}
                        hidden={session.path !== activeNote}
                        className="mx-auto min-h-full w-full max-w-note px-note-x py-between-groups"
                    >
                        {session.openFailed && session.error ? (
                            <NoteOpenError
                                title={t("notes.openError.title")}
                                message={openErrorMessage(
                                    t,
                                    session.error.code,
                                )}
                            />
                        ) : (
                            <NoteEditor
                                label={title}
                                text={session.text}
                                focusRequest={
                                    focusRequest?.path === session.path
                                        ? focusRequest.id
                                        : 0
                                }
                                onChange={(text) => {
                                    notesActions.updateText(session.path, text);
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </>
    );
}
