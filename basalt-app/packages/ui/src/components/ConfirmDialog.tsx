import { useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    destructive?: boolean;
};

function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    onConfirm,
    destructive = false,
}: ConfirmDialogProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            role="alertdialog"
            title={title}
            description={description}
            onOpenAutoFocus={(event) => {
                event.preventDefault();
                cancelRef.current?.focus();
            }}
            footer={
                <>
                    <Button ref={cancelRef} variant="ghost" onClick={() => onOpenChange(false)}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={destructive ? "destructive" : "primary"}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        />
    );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
