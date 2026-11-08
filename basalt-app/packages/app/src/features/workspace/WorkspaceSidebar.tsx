import {
    Alert,
    Button,
    EmptyState,
    ErrorState,
    NoteList,
    NoteSidebar,
    type NoteListEntry,
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
    notes: NoteListEntry[];
    selectedPath: string | null;
    listError: string | null;
    createError: string | null;
    notice: string | null;
    onSelect: (path: string) => void;
    onNewNote: () => void;
    onRetry: () => void;
};

export function WorkspaceSidebar({
    workspaceName,
    texts,
    notes,
    selectedPath,
    listError,
    createError,
    notice,
    onSelect,
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
            <NoteList
                label={texts.notesLabel}
                notes={notes}
                selectedPath={selectedPath}
                onSelect={onSelect}
                status={listError === null ? "ready" : "error"}
                empty={
                    <EmptyState
                        title={texts.emptyTitle}
                        description={texts.emptyDescription}
                        action={
                            <Button onClick={onNewNote}>
                                {texts.emptyAction}
                            </Button>
                        }
                    />
                }
                error={
                    <ErrorState
                        title={texts.listErrorTitle}
                        description={listError}
                        action={
                            <Button variant="secondary" onClick={onRetry}>
                                {texts.retry}
                            </Button>
                        }
                    />
                }
            />
        </NoteSidebar>
    );
}
