import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { ContextMenu, type MenuEntry } from "@basalt/ui";
import { useServices } from "../../useServices";
import { validateEntryName } from "./entry-name";
import { childrenOf, findTreeNode, parentFolder } from "./tree-nodes";
import { TreeDialogs } from "./TreeDialogs";
import type { MenuTarget } from "./tree-store";

function focusRow(id: string | null): void {
    const rows = [
        ...document.querySelectorAll<HTMLElement>('[role="treeitem"]'),
    ];
    const row =
        rows.find(
            (candidate) => id !== null && candidate.dataset.treeId === id,
        ) ?? rows.find((candidate) => candidate.tabIndex === 0);
    row?.focus();
}

function targetRowId(target: MenuTarget, focusedId: string | null) {
    return target.kind === "root" ? focusedId : target.path;
}

export function TreeOverlaysContainer() {
    const { t } = useTranslation();
    const { treeStore, notesStore, treeActions } = useServices();
    const { menu, dialog, focusedId } = useStore(treeStore);
    const tree = useStore(notesStore, (state) => state.tree);

    const items = useMemo((): MenuEntry[] => {
        if (!menu) return [];
        const { target } = menu;
        if (target.kind === "note") {
            return [
                {
                    label: t("tree.menu.rename"),
                    onSelect: () => {
                        treeActions.startRename(target.path);
                    },
                },
            ];
        }
        const parent = target.kind === "folder" ? target.path : null;
        return [
            {
                label: t("tree.menu.newNote"),
                onSelect: () => {
                    void treeActions.newNote(parent);
                },
            },
            {
                label: t("tree.menu.newFolder"),
                onSelect: () => {
                    treeActions.startNewFolder(parent);
                },
            },
        ];
    }, [menu, t, treeActions]);

    const dialogParent =
        dialog === null
            ? null
            : dialog.kind === "rename"
              ? parentFolder(dialog.path)
              : dialog.parent;
    const problem =
        dialog === null
            ? null
            : validateEntryName({
                  name: dialog.name,
                  kind: dialog.kind === "rename" ? "note" : "folder",
                  parent: dialogParent,
                  siblings: childrenOf(tree, dialogParent),
                  own: dialog.kind === "rename" ? dialog.path : undefined,
              });
    const currentName =
        dialog?.kind === "rename"
            ? (findTreeNode(tree, dialog.path)?.name ?? dialog.name)
            : "";
    const folderLabel =
        dialog?.kind === "new-folder" && dialog.parent !== null
            ? (findTreeNode(tree, dialog.parent)?.name ?? dialog.parent)
            : null;

    return (
        <>
            <ContextMenu
                label={t("tree.menu.label")}
                items={items}
                point={menu?.point ?? null}
                onClose={() => {
                    treeActions.closeMenu();
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    if (treeStore.getState().dialog !== null) return;
                    focusRow(
                        menu ? targetRowId(menu.target, focusedId) : focusedId,
                    );
                }}
            />
            {dialog ? (
                <TreeDialogs
                    kind={dialog.kind}
                    texts={{
                        renameTitle: t("tree.rename.title"),
                        renameSubmit: t("tree.rename.submit"),
                        renamePending: t("tree.rename.pending"),
                        renameNameLabel: t("tree.rename.nameLabel"),
                        newFolderTitle: t("tree.newFolder.title"),
                        newFolderDescription:
                            folderLabel === null
                                ? t("tree.newFolder.descriptionRoot")
                                : t("tree.newFolder.description", {
                                      folder: folderLabel,
                                  }),
                        newFolderSubmit: t("tree.newFolder.submit"),
                        newFolderPending: t("tree.newFolder.pending"),
                        newFolderNameLabel: t("tree.newFolder.nameLabel"),
                        cancel: t("tree.cancel"),
                    }}
                    currentName={currentName}
                    name={dialog.name}
                    error={
                        problem === null
                            ? undefined
                            : t(`tree.nameError.${problem}`)
                    }
                    operationError={
                        dialog.error === null
                            ? undefined
                            : t(`errors.${dialog.error}`)
                    }
                    pending={dialog.pending}
                    onNameChange={treeActions.setName}
                    onSubmit={() => {
                        void treeActions.submitDialog();
                    }}
                    onClose={treeActions.cancelDialog}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        focusRow(treeStore.getState().focusedId);
                    }}
                />
            ) : null}
        </>
    );
}
