import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type MenuAction = {
    label: string;
    onSelect: () => void;
    icon?: ReactNode;
    destructive?: boolean;
    disabled?: boolean;
};

type MenuEntry = MenuAction | "separator";

type MenuProps = {
    trigger: ReactNode;
    items: MenuEntry[];
    align?: "start" | "center" | "end";
    defaultOpen?: boolean;
};

function Menu({ trigger, items, align = "start", defaultOpen }: MenuProps) {
    return (
        <DropdownMenuPrimitive.Root defaultOpen={defaultOpen} modal={false}>
            <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    align={align}
                    sideOffset={4}
                    className="bs-menu flex min-w-sidebar flex-col rounded-container border border-border-divider bg-surface-raised p-in-group text-size-ui text-text-ui"
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

export { Menu };
export type { MenuAction, MenuEntry, MenuProps };
