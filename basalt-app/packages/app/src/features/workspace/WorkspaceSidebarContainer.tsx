import { useMemo } from "react";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { findTreeNode, toTreeNodes } from "../tree/tree-nodes";
import { setFocusedRow, toggleFolder } from "../tree/tree-store";
import { folderName } from "./folder-name";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceSidebarContainer() {
    const { t } = useTranslation();
    const { workspaceStore, notesStore, treeStore, notesActions } =
        useServices();
    const root = useStore(workspaceStore, (state) => state.root);
    const watchMode = useStore(workspaceStore, (state) => state.watchMode);
    const { tree, activeNote, listError, createError } = useStore(notesStore);
    const { expanded, focusedId } = useStore(treeStore);
    const nodes = useMemo(() => toTreeNodes(tree, expanded), [tree, expanded]);

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
            nodes={nodes}
            activeId={activeNote}
            focusedId={focusedId}
            listError={listError ? t(`errors.${listError.code}`) : null}
            createError={createError ? t(`errors.${createError.code}`) : null}
            notice={
                watchMode === "focus-fallback"
                    ? t("workspace.watchFallback")
                    : null
            }
            onOpenNote={(id) => {
                const node = findTreeNode(tree, id);
                if (node?.kind === "note") {
                    void notesActions.openNote(node.path, { focus: true });
                }
            }}
            onToggleFolder={(id) => {
                toggleFolder(treeStore, id);
            }}
            onFocusChange={(id) => {
                setFocusedRow(treeStore, id);
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
