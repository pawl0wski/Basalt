import type { ReactNode } from "react";
import { IconButton } from "../components/IconButton";
import { cn } from "../lib/utils";

type ActivityBarItem = {
    id: string;
    label: string;
    icon: ReactNode;
};

type ActivityBarProps = {
    items: ActivityBarItem[];
    footerItems?: ActivityBarItem[];
    activeId?: string;
    onSelect: (id: string) => void;
    className?: string;
};

function ActivityBar({
    items,
    footerItems = [],
    activeId,
    onSelect,
    className,
}: ActivityBarProps) {
    const renderItem = (item: ActivityBarItem) => (
        <IconButton
            key={item.id}
            size="activity"
            aria-label={item.label}
            aria-current={item.id === activeId ? "page" : undefined}
            active={item.id === activeId}
            onClick={() => onSelect(item.id)}
        >
            {item.icon}
        </IconButton>
    );

    return (
        <nav
            aria-label="Sections"
            className={cn(
                "bs-activity-bar flex h-full w-activity-bar shrink-0 flex-col items-center bg-surface-frame p-in-group",
                className,
            )}
        >
            <div className="flex flex-1 flex-col items-center gap-in-group">
                {items.map(renderItem)}
            </div>
            <div className="flex flex-col items-center gap-in-group">
                {footerItems.map(renderItem)}
            </div>
        </nav>
    );
}

export { ActivityBar };
export type { ActivityBarItem, ActivityBarProps };
