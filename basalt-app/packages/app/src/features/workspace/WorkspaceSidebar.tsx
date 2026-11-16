import type { ReactNode } from "react";
import {
    Alert,
    Button,
    EmptyState,
    ErrorState,
    NoteSidebar,
    Tree,
    type TreeDropTarget,
    type TreeNode,
    type TreeSelectionChange,
} from "@basalt/ui";

export type WorkspaceSidebarTexts = {
    sidebarLabel: string;
    newNote: string;
    notesLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
    listErrorTitle: string;
    retry: string;
};

export type WorkspaceSidebarProps = {
    workspaceName: string;
    texts: WorkspaceSidebarTexts;
    nodes: TreeNode[];
    activeId: string | null;
    focusedId: string | null;
    listError: string | null;
    createError: string | null;
    notice: string | null;
    onOpenNote: (id: string) => void;
    onToggleFolder: (id: string) => void;
    onFocusChange: (id: string) => void;
    onNewNote: () => void;
    onRetry: () => void;
    onContextMenuRequest: (
        id: string | null,
        point: { x: number; y: number },
    ) => void;
    selectedIds: ReadonlySet<string>;
    onSelectionChange: (change: TreeSelectionChange) => void;
    onClearSelection: () => void;
    draggingIds: ReadonlySet<string>;
    dropTarget: TreeDropTarget | null;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
    onDropTargetChange: (target: TreeDropTarget | null) => void;
    onDrop: (target: TreeDropTarget) => void;
    onFolderHoverOpen: (id: string) => void;
    overlays?: ReactNode;
};

export function WorkspaceSidebar({
    workspaceName,
    texts,
    nodes,
    activeId,
    focusedId,
    listError,
    createError,
    notice,
    onOpenNote,
    onToggleFolder,
    onFocusChange,
    onNewNote,
    onRetry,
    onContextMenuRequest,
    selectedIds,
    onSelectionChange,
    onClearSelection,
    draggingIds,
    dropTarget,
    onDragStart,
    onDragEnd,
    onDropTargetChange,
    onDrop,
    onFolderHoverOpen,
    overlays,
}: WorkspaceSidebarProps) {
    return (
        <NoteSidebar
            workspaceName={workspaceName}
            label={texts.sidebarLabel}
            newNoteLabel={texts.newNote}
            onNewNote={onNewNote}
            notice={notice}
        >
            {createError ? (
                <div className="p-panel">
                    <Alert variant="warning">{createError}</Alert>
                </div>
            ) : null}
            {listError !== null ? (
                <ErrorState
                    title={texts.listErrorTitle}
                    description={listError}
                    action={
                        <Button variant="secondary" onClick={onRetry}>
                            {texts.retry}
                        </Button>
                    }
                />
            ) : nodes.length === 0 ? (
                <div
                    className="min-h-full"
                    onContextMenu={(event) => {
                        event.preventDefault();
                        onContextMenuRequest(null, {
                            x: event.clientX,
                            y: event.clientY,
                        });
                    }}
                >
                    <EmptyState
                        title={texts.emptyTitle}
                        description={texts.emptyDescription}
                        action={
                            <Button onClick={onNewNote}>
                                {texts.emptyAction}
                            </Button>
                        }
                    />
                </div>
            ) : (
                <Tree
                    label={texts.notesLabel}
                    nodes={nodes}
                    activeId={activeId}
                    focusedId={focusedId}
                    selectedIds={selectedIds}
                    onSelectionChange={onSelectionChange}
                    onClearSelection={onClearSelection}
                    draggingIds={draggingIds}
                    dropTarget={dropTarget}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDropTargetChange={onDropTargetChange}
                    onDrop={onDrop}
                    onFolderHoverOpen={onFolderHoverOpen}
                    className="min-h-full"
                    onContextMenuRequest={onContextMenuRequest}
                    onFocusChange={onFocusChange}
                    onToggleFolder={onToggleFolder}
                    onOpenNote={onOpenNote}
                />
            )}
            {overlays}
        </NoteSidebar>
    );
}
