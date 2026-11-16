import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import type { MenuEntry } from "./Menu";

type ContextMenuPoint = { x: number; y: number };

type ContextMenuProps = {
    label: string;
    items: MenuEntry[];
    point: ContextMenuPoint | null;
    onClose: () => void;
    onCloseAutoFocus?: (event: Event) => void;
};

function ContextMenu({
    label,
    items,
    point,
    onClose,
    onCloseAutoFocus,
}: ContextMenuProps) {
    const anchor = useRef<HTMLSpanElement>(null);
    const x = point?.x;
    const y = point?.y;

    useEffect(() => {
        if (x === undefined || y === undefined) return;
        anchor.current?.dispatchEvent(
            new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
            }),
        );
    }, [x, y]);

    if (point === null) return null;

    return (
        <ContextMenuPrimitive.Root
            modal={false}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <ContextMenuPrimitive.Trigger asChild>
                <span ref={anchor} hidden />
            </ContextMenuPrimitive.Trigger>
            <ContextMenuPrimitive.Portal>
                <ContextMenuPrimitive.Content
                    aria-label={label}
                    onCloseAutoFocus={onCloseAutoFocus}
                    className="bs-context-menu flex min-w-overlay flex-col rounded-container border border-border-divider bg-surface-raised p-in-group text-size-ui text-text-ui"
                >
                    {items.map((item, index) =>
                        item === "separator" ? (
                            <ContextMenuPrimitive.Separator
                                key={`separator-${index}`}
                                className="my-in-group h-px bg-border-divider"
                            />
                        ) : (
                            <ContextMenuPrimitive.Item
                                key={item.label}
                                disabled={item.disabled}
                                onSelect={item.onSelect}
                                className={cn(
                                    "flex h-icon-button cursor-default items-center gap-in-group rounded-control px-between-groups outline-none data-disabled:text-text-muted data-highlighted:bg-state-selected [&_svg]:size-icon [&_svg]:shrink-0",
                                    item.destructive && "text-status-danger",
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </ContextMenuPrimitive.Item>
                        ),
                    )}
                </ContextMenuPrimitive.Content>
            </ContextMenuPrimitive.Portal>
        </ContextMenuPrimitive.Root>
    );
}

export { ContextMenu };
export type { ContextMenuPoint, ContextMenuProps };
