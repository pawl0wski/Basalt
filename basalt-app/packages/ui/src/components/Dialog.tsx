import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { IconButton } from "./IconButton";

type DialogProps = {
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    trigger?: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    role?: "dialog" | "alertdialog";
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    className?: string;
};

function Dialog({
    title,
    description,
    children,
    footer,
    trigger,
    open,
    defaultOpen,
    onOpenChange,
    role = "dialog",
    onOpenAutoFocus,
    onCloseAutoFocus,
    className,
}: DialogProps) {
    return (
        <DialogPrimitive.Root
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
        >
            {trigger ? (
                <DialogPrimitive.Trigger asChild>
                    {trigger}
                </DialogPrimitive.Trigger>
            ) : null}
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-none bg-surface-frame opacity-80" />
                <DialogPrimitive.Content
                    role={role}
                    {...(description ? {} : { "aria-describedby": undefined })}
                    onOpenAutoFocus={onOpenAutoFocus}
                    onCloseAutoFocus={onCloseAutoFocus}
                    className={cn(
                        "bs-dialog fixed inset-x-panel top-section flex flex-col gap-between-groups rounded-container border border-border-divider bg-surface-raised p-settings-card text-size-ui text-text-ui tablet:mx-auto tablet:max-w-prose",
                        className,
                    )}
                >
                    <div className="flex items-start justify-between gap-between-groups">
                        <div className="flex flex-col gap-in-group">
                            <DialogPrimitive.Title className="font-ui-strong text-size-ui text-text-ui">
                                {title}
                            </DialogPrimitive.Title>
                            {description ? (
                                <DialogPrimitive.Description className="text-size-ui-small text-text-muted">
                                    {description}
                                </DialogPrimitive.Description>
                            ) : null}
                        </div>
                        <DialogPrimitive.Close asChild>
                            <IconButton aria-label="Close" tooltip={false}>
                                <X aria-hidden="true" />
                            </IconButton>
                        </DialogPrimitive.Close>
                    </div>
                    {children}
                    {footer ? (
                        <div className="flex flex-col-reverse gap-between-groups tablet:flex-row tablet:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

export { Dialog };
export type { DialogProps };
