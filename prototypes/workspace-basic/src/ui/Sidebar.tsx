import {
    Alert,
    Button,
    EmptyState,
    ErrorState,
    IconButton,
    Skeleton,
} from "@basalt/ui";
import { FilePlus } from "lucide-react";
import { listedFiles } from "../model/reducer";
import { useStore } from "../model/store";
import { FolderTree } from "./FolderTree";

function TreeSkeleton() {
    return (
        <div
            data-gap="DSG-09"
            role="status"
            aria-busy="true"
            className="flex flex-col gap-in-group p-panel"
        >
            <span className="sr-only">Loading notes</span>
            <Skeleton className="h-tree-row" />
            <Skeleton className="h-tree-row" />
            <Skeleton className="h-tree-row" />
            <Skeleton className="h-tree-row" />
        </div>
    );
}

export function Sidebar() {
    const { state, dispatch } = useStore();
    const workspace = state.workspace;
    if (!workspace) return null;
    const hasEntries = Object.keys(listedFiles(state)).length > 0;
    const newNote = () => dispatch({ type: "quick-note", folder: "" });
    const messages = [
        state.scenario.watcher === "unavailable"
            ? "Basalt cannot watch this folder. The list refreshes when you return to this window."
            : null,
        state.sidebarNotice,
    ].filter(Boolean);

    return (
        <nav
            aria-label="Workspace"
            data-gap="NoteSidebar"
            className="bs-note-sidebar flex h-full w-full flex-col bg-surface-card text-size-ui text-text-ui"
        >
            <div className="flex items-center justify-between gap-between-groups border-b border-border-divider p-panel">
                <p className="truncate font-ui-strong">{workspace.name}</p>
                <IconButton aria-label="New note" onClick={newNote}>
                    <FilePlus aria-hidden="true" />
                </IconButton>
            </div>
            {messages.length > 0 ? (
                <div className="p-panel">
                    <Alert>
                        <div className="flex flex-col gap-in-group">
                            {messages.map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    </Alert>
                </div>
            ) : null}
            <div className="min-h-none flex-1 overflow-y-auto">
                {state.listStatus === "loading" ? (
                    <TreeSkeleton />
                ) : state.listStatus === "error" ? (
                    <ErrorState
                        title="Notes could not be read"
                        description="Basalt could not read the list of notes in this folder."
                        action={
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    dispatch({ type: "reload-list" })
                                }
                            >
                                Try again
                            </Button>
                        }
                    />
                ) : hasEntries ? (
                    <FolderTree />
                ) : (
                    <EmptyState
                        title="No notes yet"
                        description="Create your first note in this workspace."
                        action={
                            <Button onClick={newNote}>
                                Create your first note
                            </Button>
                        }
                    />
                )}
            </div>
        </nav>
    );
}
