import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type ScrollAreaProps = {
    label: string;
    children: ReactNode;
    className?: string;
    type?: "always" | "hover" | "scroll";
};

function ScrollArea({
    label,
    children,
    className,
    type = "always",
}: ScrollAreaProps) {
    return (
        <ScrollAreaPrimitive.Root
            type={type}
            className={cn("relative overflow-hidden", className)}
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
                "flex touch-none select-none",
                orientation === "vertical"
                    ? "h-full w-scrollbar flex-col"
                    : "h-scrollbar flex-row",
            )}
        >
            <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-control bg-scrollbar-thumb hover:bg-scrollbar-thumb-hover" />
        </ScrollAreaPrimitive.Scrollbar>
    );
}

export { ScrollArea };
export type { ScrollAreaProps };
