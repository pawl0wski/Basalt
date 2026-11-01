import { cn } from "@basalt/ui";
import type { MenuEntry } from "@basalt/ui";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

type ContextMenuProps = {
    x: number;
    y: number;
    label: string;
    items: MenuEntry[];
    onClose: () => void;
    onRestoreFocus?: () => void;
};

export function ContextMenu({
    x,
    y,
    label,
    items,
    onClose,
    onRestoreFocus,
}: ContextMenuProps) {
    return (
        <DropdownMenuPrimitive.Root
            open
            modal={false}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DropdownMenuPrimitive.Trigger asChild>
                <span
                    aria-hidden="true"
                    data-gap="DSG-03"
                    style={{
                        position: "fixed",
                        left: x,
                        top: y,
                        width: 0,
                        height: 0,
                    }}
                />
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    aria-label={label}
                    aria-labelledby={undefined}
                    align="start"
                    sideOffset={2}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        onRestoreFocus?.();
                    }}
                    className="bs-menu flex min-w-overlay flex-col rounded-container border border-border-divider bg-surface-raised p-in-group text-size-ui text-text-ui"
                >
                    {items.map((item, index) =>
                        item === "separator" ? (
                            <DropdownMenuPrimitive.Separator
                                key={`separator-${index}`}
                                className="my-in-group h-px bg-border-divider"
                            />
                        ) : (
                            <DropdownMenuPrimitive.Item
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
                            </DropdownMenuPrimitive.Item>
                        ),
                    )}
                </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
    );
}
