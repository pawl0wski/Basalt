import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { NoteEditorAreaContainer } from "../editor/NoteEditorAreaContainer";
import { WorkspaceMain } from "./WorkspaceMain";

export function WorkspaceMainContainer() {
    const { t } = useTranslation();
    const { notesStore } = useServices();
    const hasOpenNote = useStore(
        notesStore,
        (state) => state.openNotes.length > 0,
    );

    if (hasOpenNote) return <NoteEditorAreaContainer />;

    return (
        <WorkspaceMain
            title={t("workspace.noNote.title")}
            description={t("workspace.noNote.description")}
        />
    );
}
