import { useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";

type SaveFailedDialogProps = {
    open: boolean;
    noteName: string;
    reason?: ReactNode;
    onRetry: () => void;
    onDiscard: () => void;
    onCancel: () => void;
};

function SaveFailedDialog({
    open,
    noteName,
    reason = "The note could not be written to the workspace folder.",
    onRetry,
    onDiscard,
    onCancel,
}: SaveFailedDialogProps) {
    const retryRef = useRef<HTMLButtonElement>(null);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onCancel();
            }}
            role="alertdialog"
            onOpenAutoFocus={(event) => {
                event.preventDefault();
                retryRef.current?.focus();
            }}
            title={`Could not save "${noteName}"`}
            description={reason}
            footer={
                <>
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onDiscard}>
                        Discard changes
                    </Button>
                    <Button ref={retryRef} onClick={onRetry}>Retry</Button>
                </>
            }
        />
    );
}

export { SaveFailedDialog };
export type { SaveFailedDialogProps };
