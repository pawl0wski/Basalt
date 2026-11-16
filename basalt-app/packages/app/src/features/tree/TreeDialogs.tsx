import { NewFolderDialog, RenameDialog } from "@basalt/ui";

export type TreeDialogsTexts = {
    renameTitle: string;
    renameSubmit: string;
    renamePending: string;
    renameNameLabel: string;
    newFolderTitle: string;
    newFolderDescription: string;
    newFolderSubmit: string;
    newFolderPending: string;
    newFolderNameLabel: string;
    cancel: string;
};

export type TreeDialogsProps = {
    kind: "rename" | "new-folder";
    texts: TreeDialogsTexts;
    currentName: string;
    name: string;
    error: string | undefined;
    operationError: string | undefined;
    pending: boolean;
    onNameChange: (name: string) => void;
    onSubmit: () => void;
    onClose: () => void;
    onCloseAutoFocus: (event: Event) => void;
};

export function TreeDialogs({
    kind,
    texts,
    currentName,
    name,
    error,
    operationError,
    pending,
    onNameChange,
    onSubmit,
    onClose,
    onCloseAutoFocus,
}: TreeDialogsProps) {
    const shared = {
        open: true,
        onOpenChange: (open: boolean) => {
            if (!open) onClose();
        },
        cancelLabel: texts.cancel,
        name,
        onNameChange,
        error,
        operationError,
        pending,
        onSubmit,
        onCloseAutoFocus,
    };
    return kind === "rename" ? (
        <RenameDialog
            {...shared}
            title={texts.renameTitle}
            nameLabel={texts.renameNameLabel}
            submitLabel={texts.renameSubmit}
            pendingLabel={texts.renamePending}
            currentName={currentName}
        />
    ) : (
        <NewFolderDialog
            {...shared}
            title={texts.newFolderTitle}
            description={texts.newFolderDescription}
            nameLabel={texts.newFolderNameLabel}
            submitLabel={texts.newFolderSubmit}
            pendingLabel={texts.newFolderPending}
        />
    );
}
