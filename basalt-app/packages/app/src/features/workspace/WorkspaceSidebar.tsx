import {
    Alert,
    Button,
    EmptyState,
    ErrorState,
    NoteSidebar,
    Tree,
    type TreeNode,
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
                <EmptyState
                    title={texts.emptyTitle}
                    description={texts.emptyDescription}
                    action={
                        <Button onClick={onNewNote}>{texts.emptyAction}</Button>
                    }
                />
            ) : (
                <Tree
                    label={texts.notesLabel}
                    nodes={nodes}
                    activeId={activeId}
                    focusedId={focusedId}
                    draggable={false}
                    onFocusChange={onFocusChange}
                    onToggleFolder={onToggleFolder}
                    onOpenNote={onOpenNote}
                />
            )}
        </NoteSidebar>
    );
}
