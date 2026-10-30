import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePlus } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { expect, screen, within } from "storybook/test";
import { AppShell, manyNotes, NoteColumn, sampleImage, sampleNotes, WeeklyPlan, workspaceName } from "../../.storybook/blocks";
import { Alert } from "../../src/components/Alert";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { ImagePlaceholder, NoteImage } from "../../src/product/ImagePlaceholder";
import { NewNoteDialog } from "../../src/product/NewNoteDialog";
import { NoteBanner } from "../../src/product/NoteBanner";
import { NoteList } from "../../src/product/NoteList";
import { NoteSidebar } from "../../src/product/NoteSidebar";
import { SaveFailedDialog } from "../../src/product/SaveFailedDialog";
import type { SaveState } from "../../src/product/SaveStatus";
import { StatusBar } from "../../src/product/StatusBar";
import { WelcomeScreen } from "../../src/product/WelcomeScreen";

const noop = () => {};

type WorkspaceProps = {
    notes?: typeof sampleNotes;
    listStatus?: "ready" | "loading" | "error";
    selectedPath?: string | null;
    notice?: ReactNode;
    banner?: ReactNode;
    saveState?: SaveState;
    body?: ReactNode;
    counts?: boolean;
    dialogs?: ReactNode;
};

const emptyList = (
    <EmptyState
        headingAs="h3"
        title="Create your first note"
        description="Notes are saved as Markdown files in this folder."
        action={<Button variant="secondary"><FilePlus aria-hidden="true" />New note</Button>}
    />
);

const listError = (
    <ErrorState
        title="Could not read the folder"
        description="Check that it still exists and that you can read it."
        action={<Button variant="secondary">Try again</Button>}
    />
);

function Workspace({
    notes = sampleNotes,
    listStatus = "ready",
    selectedPath = "Weekly plan.md",
    notice,
    banner,
    saveState = "saved",
    body,
    counts = true,
    dialogs,
}: WorkspaceProps) {
    const hasNote = selectedPath !== null && listStatus === "ready" && notes.length > 0;
    return (
        <>
            <AppShell
                sidebar={
                    <NoteSidebar workspaceName={workspaceName} onChangeWorkspace={noop} onNewNote={noop} notice={notice}>
                        <NoteList
                            label="Notes"
                            notes={notes}
                            selectedPath={selectedPath}
                            onSelect={noop}
                            status={listStatus}
                            empty={emptyList}
                            error={listError}
                        />
                    </NoteSidebar>
                }
                statusBar={hasNote ? <StatusBar wordCount={counts ? 1204 : undefined} characterCount={counts ? 7311 : undefined} saveState={saveState} /> : <StatusBar />}
            >
                {hasNote ? <NoteColumn banner={banner}>{body}</NoteColumn> : <div className="p-section text-text-muted">Select a note to start writing.</div>}
            </AppShell>
            {dialogs}
        </>
    );
}

const meta = {
    title: "Screens/E01-S01 Local notes",
    tags: ["!autodocs"],
    parameters: { layout: "fullscreen", docs: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
    render: () => <div className="h-screen bg-surface-editor"><WelcomeScreen onOpenWorkspace={noop} /></div>,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getAllByRole("button")).toHaveLength(1);
    },
};

export const WelcomeAfterWorkspaceLost: Story = {
    render: () => (
        <div className="h-screen bg-surface-editor">
            <WelcomeScreen
                onOpenWorkspace={noop}
                notice="The folder Personal notes is no longer available. Your notes were not changed. Open it again or choose another folder."
            />
        </div>
    ),
};

export const WorkspaceWithNoteOpen: Story = {
    render: () => <Workspace />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole("option", { name: "Weekly plan" })).toHaveAttribute("aria-selected", "true");
        await expect(canvas.getByRole("heading", { level: 1, name: "Weekly plan" })).toBeVisible();
    },
};

export const EmptyWorkspace: Story = {
    render: () => <Workspace notes={[]} selectedPath={null} />,
};

export const LoadingTheList: Story = {
    render: () => <Workspace listStatus="loading" selectedPath={null} />,
};

export const ListCouldNotBeRead: Story = {
    render: () => <Workspace listStatus="error" selectedPath={null} />,
};

export const ManyNotes: Story = {
    render: () => <Workspace notes={manyNotes(500)} selectedPath="journal/Daily 2025-01-03.md" />,
};

export const WatcherFallbackNotice: Story = {
    render: () => <Workspace notice="The list refreshes when you return to this window." />,
};

export const Saving: Story = {
    render: () => <Workspace saveState="saving" />,
};

export const NotSaved: Story = {
    render: () => <Workspace saveState="unsaved" />,
};

export const NewNoteDialogOpen: Story = {
    render: () => (
        <Workspace dialogs={<NewNoteDialog open onOpenChange={noop} name="Untitled" onNameChange={noop} onCreate={noop} />} />
    ),
    play: async () => {
        await expect(await screen.findByRole("textbox", { name: "Note name" })).toHaveValue("Untitled");
    },
};

export const NewNoteNameTaken: Story = {
    render: () => (
        <Workspace
            dialogs={
                <NewNoteDialog
                    open
                    onOpenChange={noop}
                    name="Weekly plan"
                    onNameChange={noop}
                    error="A note named Weekly plan already exists. Choose another name."
                    onCreate={noop}
                />
            }
        />
    ),
};

export const ConflictWithTheFileOnDisk: Story = {
    render: () => <Workspace saveState="unsaved" banner={<NoteBanner kind="conflict" onKeepMine={noop} onLoadFromDisk={noop} />} />,
};

export const NoteDeletedOnDisk: Story = {
    render: () => <Workspace saveState="unsaved" banner={<NoteBanner kind="deleted" onSaveAgain={noop} onCloseNote={noop} />} />,
};

export const FolderIsReadOnly: Story = {
    render: () => <Workspace saveState="unsaved" banner={<NoteBanner kind="permission-denied" onRetry={noop} />} />,
};

export const SaveFailedWhenLeavingTheNote: Story = {
    render: () => (
        <Workspace
            saveState="unsaved"
            dialogs={<SaveFailedDialog open noteName="Weekly plan" onRetry={noop} onDiscard={noop} onCancel={noop} />}
        />
    ),
};

export const NoteTooLarge: Story = {
    render: () => (
        <Workspace counts={false} banner={<NoteBanner kind="too-large" />} body={<h1 className="text-size-note-h1 text-text-note">Export dump</h1>} />
    ),
};

export const NoteIsNotUtf8: Story = {
    render: () => (
        <Workspace counts={false} banner={<NoteBanner kind="not-utf8" />} body={<h1 className="text-size-note-h1 text-text-note">Old import</h1>} />
    ),
};

function ImagesBody({ notice, extra }: { notice?: ReactNode; extra?: boolean }) {
    const source = useMemo(() => sampleImage(1600, 900), []);
    return (
        <>
            {notice}
            <h1 className="text-size-note-h1 text-text-note">Whiteboard session</h1>
            <p className="text-size-note text-text-note">Photo of the board after the sync design meeting:</p>
            <NoteImage src={source} alt="Whiteboard photo" width={1600} height={900} />
            {extra ? (
                <>
                    <ImagePlaceholder problem="not-found" path="attachments/diagram.png" />
                    <ImagePlaceholder problem="unsupported" />
                    <ImagePlaceholder problem="remote" />
                    <ImagePlaceholder problem="loading" />
                </>
            ) : null}
            <WeeklyPlan />
        </>
    );
}

export const ImageInNote: Story = {
    name: "E01-S03 Image in a note",
    render: () => <Workspace selectedPath="Weekly plan.md" body={<ImagesBody />} />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole("img", { name: "Whiteboard photo" })).toBeVisible();
    },
};

export const ImagesThatCannotBeShown: Story = {
    name: "E01-S03 Images that cannot be shown",
    render: () => <Workspace body={<ImagesBody extra />} />,
};

export const SomeDroppedFilesWereSkipped: Story = {
    name: "E01-S03 Some dropped files were skipped",
    render: () => (
        <Workspace
            body={
                <ImagesBody
                    notice={<Alert variant="warning" title="2 files were not added">Format not supported.</Alert>}
                />
            }
        />
    ),
};
