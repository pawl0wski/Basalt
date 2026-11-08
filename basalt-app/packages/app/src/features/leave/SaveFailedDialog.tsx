import { useRef } from "react";
import { Button, Dialog } from "@basalt/ui";

export type SaveFailedDialogProps = {
    open: boolean;
    title: string;
    reason: string;
    labels: { retry: string; discard: string; cancel: string };
    onRetry: () => void;
    onDiscard: () => void;
    onCancel: () => void;
};

export function SaveFailedDialog({
    open,
    title,
    reason,
    labels,
    onRetry,
    onDiscard,
    onCancel,
}: SaveFailedDialogProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onCancel();
            }}
            role="alertdialog"
            onOpenAutoFocus={(event) => {
                event.preventDefault();
                cancelRef.current?.focus();
            }}
            title={title}
            description={reason}
            footer={
                <>
                    <Button ref={cancelRef} variant="ghost" onClick={onCancel}>
                        {labels.cancel}
                    </Button>
                    <Button variant="destructive" onClick={onDiscard}>
                        {labels.discard}
                    </Button>
                    <Button onClick={onRetry}>{labels.retry}</Button>
                </>
            }
        />
    );
}
