import { FilePlus } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "../components/Alert";
import { IconButton } from "../components/IconButton";
import { cn } from "../lib/utils";

type NoteSidebarProps = {
    workspaceName: string;
    onNewNote: () => void;
    label?: string;
    newNoteLabel?: string;
    notice?: ReactNode;
    children: ReactNode;
    className?: string;
};

function NoteSidebar({
    workspaceName,
    onNewNote,
    label = "Workspace",
    newNoteLabel = "New note",
    notice,
    children,
    className,
}: NoteSidebarProps) {
    return (
        <nav
            aria-label={label}
            className={cn(
                "bs-note-sidebar flex h-full w-full flex-col bg-surface-card text-size-ui text-text-ui tablet:w-sidebar",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-between-groups border-b border-border-divider p-panel">
                <p className="truncate font-ui-strong">{workspaceName}</p>
                <IconButton aria-label={newNoteLabel} onClick={onNewNote}>
                    <FilePlus aria-hidden="true" />
                </IconButton>
            </div>
            {notice ? (
                <div className="p-panel">
                    <Alert>{notice}</Alert>
                </div>
            ) : null}
            <div className="min-h-none flex-1 overflow-y-auto">{children}</div>
        </nav>
    );
}

export { NoteSidebar };
export type { NoteSidebarProps };
