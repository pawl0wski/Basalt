import { PanelRightClose, Search } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "../components/IconButton";
import { cn } from "../lib/utils";

type SidePanelProps = {
    title: string;
    onClose: () => void;
    onSearch?: () => void;
    children: ReactNode;
    className?: string;
};

function SidePanel({
    title,
    onClose,
    onSearch,
    children,
    className,
}: SidePanelProps) {
    return (
        <aside
            aria-label={title}
            className={cn(
                "bs-side-panel flex h-full w-sidebar shrink-0 flex-col bg-surface-card text-size-ui text-text-ui",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-between-groups border-b border-border-divider p-panel">
                <p className="truncate font-ui-strong">{title}</p>
                <div className="flex shrink-0 items-center gap-in-group">
                    {onSearch ? (
                        <IconButton
                            aria-label={`Search ${title}`}
                            onClick={onSearch}
                        >
                            <Search aria-hidden="true" />
                        </IconButton>
                    ) : null}
                    <IconButton aria-label={`Close ${title}`} onClick={onClose}>
                        <PanelRightClose aria-hidden="true" />
                    </IconButton>
                </div>
            </div>
            <div
                tabIndex={0}
                className="scrollbar-thin min-h-none flex-1 overflow-y-auto focus-visible:focus-ring-inset"
            >
                {children}
            </div>
        </aside>
    );
}

export { SidePanel };
export type { SidePanelProps };
