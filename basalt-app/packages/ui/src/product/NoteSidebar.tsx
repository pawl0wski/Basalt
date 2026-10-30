import { FilePlus } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { cn } from "../lib/utils";

type NoteSidebarProps = {
    workspaceName: string;
    onChangeWorkspace: () => void;
    onNewNote: () => void;
    notice?: ReactNode;
    children: ReactNode;
    className?: string;
};

function NoteSidebar({
    workspaceName,
    onChangeWorkspace,
    onNewNote,
    notice,
    children,
    className,
}: NoteSidebarProps) {
    return (
        <nav
            aria-label="Workspace"
            className={cn(
                "bs-note-sidebar flex h-full w-full flex-col bg-surface-card text-size-ui text-text-ui tablet:w-sidebar",
                className,
            )}
        >
            <div className="flex flex-col gap-in-group border-b border-border-divider p-panel">
                <div className="flex items-center justify-between gap-between-groups">
                    <p className="truncate font-ui-strong">{workspaceName}</p>
                    <IconButton aria-label="New note" onClick={onNewNote}>
                        <FilePlus aria-hidden="true" />
                    </IconButton>
                </div>
                <div>
                    <Button variant="ghost" onClick={onChangeWorkspace}>
                        Change workspace
                    </Button>
                </div>
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
