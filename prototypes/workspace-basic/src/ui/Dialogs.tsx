import {
    Button,
    ConfirmDialog,
    Dialog,
    Field,
    Input,
    SaveFailedDialog,
} from "@basalt/ui";
import type { FormEvent } from "react";
import { noteName } from "../model/names";
import { useStore } from "../model/store";

type NameDialogProps = {
    title: string;
    description: string;
    label: string;
    submitLabel: string;
    pendingLabel: string;
    name: string;
    error?: string;
    pending?: boolean;
};

function NameDialog({
    title,
    description,
    label,
    submitLabel,
    pendingLabel,
    name,
    error,
    pending = false,
}: NameDialogProps) {
    const { dispatch } = useStore();
    const close = () => dispatch({ type: "close-dialog" });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        dispatch({ type: "submit-dialog" });
    };
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) close();
            }}
            title={title}
            description={description}
        >
            <form
                data-gap="DSG-04"
                onSubmit={submit}
                className="flex flex-col gap-between-groups"
            >
                <Field label={label} error={error} required>
                    <Input
                        value={name}
                        onChange={(event) =>
                            dispatch({
                                type: "dialog-name",
                                name: event.target.value,
                            })
                        }
                        autoFocus
                        onFocus={(event) => event.target.select()}
                    />
                </Field>
                <div className="flex flex-col-reverse gap-between-groups tablet:flex-row tablet:justify-end">
                    <Button variant="ghost" onClick={close}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={
                            Boolean(error) || pending || name.trim() === ""
                        }
                    >
                        {pending ? pendingLabel : submitLabel}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

export function Dialogs() {
    const { state, dispatch } = useStore();
    const dialog = state.dialog;
    if (!dialog) return null;
    const close = () => dispatch({ type: "close-dialog" });

    switch (dialog.kind) {
        case "new-folder":
            return (
                <NameDialog
                    title="New folder"
                    description={
                        dialog.parent
                            ? `The folder is created inside "${dialog.parent}".`
                            : "The folder is created in the workspace folder."
                    }
                    label="Folder name"
                    submitLabel="Create folder"
                    pendingLabel="Creating…"
                    name={dialog.name}
                    error={dialog.error}
                    pending={dialog.pending}
                />
            );
        case "rename":
            return (
                <NameDialog
                    title="Rename note"
                    description="The file is renamed in the workspace. The note stays open."
                    label="Note name"
                    submitLabel="Rename note"
                    pendingLabel="Renaming…"
                    name={dialog.name}
                    error={dialog.error}
                    pending={dialog.pending}
                />
            );
        case "delete":
            return (
                <ConfirmDialog
                    open
                    onOpenChange={(open) => {
                        if (!open) close();
                    }}
                    title={
                        dialog.paths.length > 1
                            ? `Delete ${dialog.paths.length} notes?`
                            : `Delete "${noteName(dialog.paths[0])}"?`
                    }
                    description={`${
                        dialog.paths.length > 1
                            ? "The notes are moved"
                            : "The note is moved"
                    } to the operating system trash. The trash is simulated in this prototype.${
                        state.tabs.some(
                            (tab) =>
                                dialog.paths.includes(tab.path) &&
                                tab.text !== tab.savedText,
                        )
                            ? " Text that is not saved yet will be lost."
                            : ""
                    }`}
                    confirmLabel={
                        dialog.paths.length > 1
                            ? `Delete ${dialog.paths.length} notes`
                            : `Delete ${noteName(dialog.paths[0])}`
                    }
                    destructive
                    onConfirm={() => dispatch({ type: "submit-dialog" })}
                />
            );
        case "save-failed":
            return (
                <SaveFailedDialog
                    open
                    noteName={noteName(dialog.path)}
                    reason={
                        dialog.retryFailed
                            ? `Retry failed. ${dialog.reason}`
                            : dialog.reason
                    }
                    onRetry={() => dispatch({ type: "save-failed-retry" })}
                    onDiscard={() => dispatch({ type: "save-failed-discard" })}
                    onCancel={close}
                />
            );
        case "discard-edits":
            return (
                <ConfirmDialog
                    open
                    onOpenChange={(open) => {
                        if (!open) close();
                    }}
                    title={
                        dialog.action === "load-from-disk"
                            ? "Load the version from disk?"
                            : "Close this note?"
                    }
                    description={
                        dialog.action === "load-from-disk"
                            ? `Your unsaved changes in "${noteName(dialog.path)}" will be lost.`
                            : `"${noteName(dialog.path)}" was deleted or moved. Your unsaved changes will be lost.`
                    }
                    confirmLabel={
                        dialog.action === "load-from-disk"
                            ? "Load version from disk"
                            : "Close note"
                    }
                    destructive
                    onConfirm={() => dispatch({ type: "confirm-discard" })}
                />
            );
    }
}
