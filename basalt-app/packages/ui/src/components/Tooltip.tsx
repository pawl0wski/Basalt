import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

type TooltipProps = {
    content: ReactNode;
    children: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
};

function Tooltip({ content, children, side = "top" }: TooltipProps) {
    return (
        <TooltipPrimitive.Provider delayDuration={400}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        sideOffset={4}
                        className="bs-tooltip rounded-control border border-border-divider bg-surface-raised px-between-groups py-in-group text-size-ui-small text-text-ui"
                    >
                        {content}
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}

export { Tooltip };
export type { TooltipProps };
