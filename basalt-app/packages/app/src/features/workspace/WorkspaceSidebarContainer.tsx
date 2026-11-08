import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { folderName } from "./folder-name";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceSidebarContainer() {
    const { t } = useTranslation();
    const { workspaceStore, notesStore, notesActions } = useServices();
    const root = useStore(workspaceStore, (state) => state.root);
    const watchMode = useStore(workspaceStore, (state) => state.watchMode);
    const { notes, activeNote, listError, createError } = useStore(notesStore);

    return (
        <WorkspaceSidebar
            workspaceName={root === null ? "" : folderName(root)}
            texts={{
                sidebarLabel: t("workspace.sidebarLabel"),
                newNote: t("workspace.newNote"),
                notesLabel: t("workspace.notesLabel"),
                emptyTitle: t("workspace.empty.title"),
                emptyDescription: t("workspace.empty.description"),
                emptyAction: t("workspace.empty.action"),
                listErrorTitle: t("workspace.listError.title"),
                retry: t("workspace.listError.retry"),
            }}
            notes={notes.map((note) => ({ path: note.path, name: note.name }))}
            selectedPath={activeNote}
            listError={listError ? t(`errors.${listError.code}`) : null}
            createError={createError ? t(`errors.${createError.code}`) : null}
            notice={
                watchMode === "focus-fallback"
                    ? t("workspace.watchFallback")
                    : null
            }
            onSelect={(path) => {
                const note = notes.find((candidate) => candidate.path === path);
                if (note)
                    void notesActions.openNote(note.path, { focus: true });
            }}
            onNewNote={() => {
                void notesActions.createNote();
            }}
            onRetry={() => {
                void notesActions.refreshNotes();
            }}
        />
    );
}
