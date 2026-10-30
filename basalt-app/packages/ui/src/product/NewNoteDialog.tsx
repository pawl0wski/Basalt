import type { FormEvent } from "react";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";
import { Field } from "../components/Field";
import { Input } from "../components/Input";

type NewNoteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    onNameChange: (name: string) => void;
    error?: string;
    pending?: boolean;
    onCreate: () => void;
};

function NewNoteDialog({
    open,
    onOpenChange,
    name,
    onNameChange,
    error,
    pending = false,
    onCreate,
}: NewNoteDialogProps) {
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!error && !pending && name.trim() !== "") onCreate();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            title="New note"
            description="The note is created in the workspace folder."
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-between-groups">
                <Field label="Note name" error={error} required>
                    <Input
                        value={name}
                        onChange={(event) => onNameChange(event.target.value)}
                        autoFocus
                        onFocus={(event) => event.target.select()}
                    />
                </Field>
                <div className="flex flex-col-reverse gap-between-groups tablet:flex-row tablet:justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={Boolean(error) || pending || name.trim() === ""}
                    >
                        {pending ? "Creating…" : "Create note"}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

export { NewNoteDialog };
export type { NewNoteDialogProps };
