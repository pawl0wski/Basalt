import type { FormEvent, ReactNode } from "react";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";
import { Field } from "../components/Field";
import { InlineError } from "../components/InlineError";
import { Input } from "../components/Input";

type NameDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    nameLabel: string;
    submitLabel: string;
    pendingLabel: string;
    cancelLabel: string;
    name: string;
    onNameChange: (name: string) => void;
    error?: string;
    operationError?: ReactNode;
    pending?: boolean;
    submitDisabled?: boolean;
    onSubmit: () => void;
    onCloseAutoFocus?: (event: Event) => void;
};

function NameDialog({
    open,
    onOpenChange,
    title,
    description,
    nameLabel,
    submitLabel,
    pendingLabel,
    cancelLabel,
    name,
    onNameChange,
    error,
    operationError,
    pending = false,
    submitDisabled = false,
    onSubmit,
    onCloseAutoFocus,
}: NameDialogProps) {
    const blocked =
        Boolean(error) || pending || submitDisabled || name.trim() === "";

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!blocked) onSubmit();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            onCloseAutoFocus={onCloseAutoFocus}
        >
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-between-groups"
            >
                <Field label={nameLabel} error={error} required>
                    <Input
                        value={name}
                        onChange={(event) => onNameChange(event.target.value)}
                        autoFocus
                        onFocus={(event) => event.target.select()}
                    />
                </Field>
                {operationError ? (
                    <InlineError>{operationError}</InlineError>
                ) : null}
                <div className="flex flex-col-reverse gap-between-groups tablet:flex-row tablet:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelLabel}
                    </Button>
                    <Button type="submit" disabled={blocked}>
                        {pending ? pendingLabel : submitLabel}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

export { NameDialog };
export type { NameDialogProps };
