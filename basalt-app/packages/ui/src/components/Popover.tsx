import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactNode } from "react";

type PopoverProps = {
    trigger: ReactNode;
    label: string;
    children: ReactNode;
    align?: "start" | "center" | "end";
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
};

function Popover({
    trigger,
    label,
    children,
    align = "start",
    open,
    defaultOpen,
    onOpenChange,
}: PopoverProps) {
    return (
        <PopoverPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    aria-label={label}
                    align={align}
                    sideOffset={4}
                    className="bs-popover max-w-sidebar rounded-container border border-border-divider bg-surface-raised p-panel text-size-ui text-text-ui"
                >
                    {children}
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}

export { Popover };
export type { PopoverProps };
