import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type ScrollAreaProps = {
    label: string;
    children: ReactNode;
    className?: string;
};

function ScrollArea({ label, children, className }: ScrollAreaProps) {
    return (
        <ScrollAreaPrimitive.Root
            className={cn("bs-scroll-area relative overflow-hidden", className)}
        >
            <ScrollAreaPrimitive.Viewport
                role="region"
                aria-label={label}
                tabIndex={0}
                className="size-full focus-visible:focus-ring-inset"
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

function ScrollBar({
    orientation,
}: {
    orientation: "vertical" | "horizontal";
}) {
    return (
        <ScrollAreaPrimitive.Scrollbar
            orientation={orientation}
            className={cn(
                "flex touch-none select-none p-in-group",
                orientation === "vertical"
                    ? "h-full w-between-groups flex-col"
                    : "h-between-groups flex-row",
            )}
        >
            <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-control bg-border-control" />
        </ScrollAreaPrimitive.Scrollbar>
    );
}

export { ScrollArea };
export type { ScrollAreaProps };
