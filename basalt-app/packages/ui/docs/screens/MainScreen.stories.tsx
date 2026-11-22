import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bookmark, Files, Search, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { sampleNotes, workspaceName } from "../../.storybook/blocks";
import { Button } from "../../src/components/Button";
import { Checkbox } from "../../src/components/Checkbox";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { StatusIndicator } from "../../src/components/StatusIndicator";
import type { SyncStatus } from "../../src/components/StatusIndicator";
import { ActivityBar } from "../../src/product/ActivityBar";
import { AppShell } from "../../src/product/AppShell";
import { NoteBanner } from "../../src/product/NoteBanner";
import { NoteList } from "../../src/product/NoteList";
import { NoteSidebar } from "../../src/product/NoteSidebar";
import { SidePanel } from "../../src/product/SidePanel";
import { StatusBar } from "../../src/product/StatusBar";
import { TitleBar } from "../../src/product/TitleBar";

const noop = () => {};

const windowControls = {
    onMinimize: noop,
    onToggleMaximize: noop,
    onClose: noop,
};

const sections = [
    { id: "notes", label: "Notes", icon: <Files aria-hidden="true" /> },
    { id: "search", label: "Search", icon: <Search aria-hidden="true" /> },
    {
        id: "bookmarks",
        label: "Bookmarks",
        icon: <Bookmark aria-hidden="true" />,
    },
];

const footerSections = [
    {
        id: "settings",
        label: "Settings",
        icon: <Settings aria-hidden="true" />,
    },
];

const openNotes = [
    { id: "Weekly plan.md", name: "Weekly plan" },
    { id: "projects/Sync server spec.md", name: "Sync server spec" },
];

function NoteBody() {
    return (
        <>
            <h1 className="text-size-note-h1 text-text-note">Weekly plan</h1>
            <h2 className="text-size-note-h2 text-text-note">Monday</h2>
            <p className="text-size-note text-text-note">
                Review the sync server spec before the encryption work starts,
                and write down the open questions.
            </p>
            <ul className="m-none flex list-disc flex-col gap-in-group pl-section text-size-note text-text-note">
                <li>Check how images are stored next to notes</li>
                <li>Decide what the status bar shows</li>
                <li>Move the reading list to its own note</li>
            </ul>
            <h2 className="text-size-note-h2 text-text-note">Thursday</h2>
            <div className="flex flex-col gap-in-group">
                <Checkbox
                    label="Try the app on a folder with a few hundred notes"
                    defaultChecked
                />
                <Checkbox label="Compare the list speed with the old app" />
            </div>
            <p className="text-size-note text-text-note">
                Attachments stay next to the note, for example{" "}
                <code className="font-code text-size-code text-text-note">
                    attachments/diagram.png
                </code>
                .
            </p>
            <pre
                tabIndex={0}
                className="m-none overflow-x-auto rounded-control bg-code-block-bg p-panel font-code text-size-code text-text-ui focus-visible:focus-ring"
            >
                {"basalt sync --workspace ~/Basalt --status"}
            </pre>
        </>
    );
}

type MainScreenProps = {
    notes?: typeof sampleNotes;
    listStatus?: "ready" | "loading" | "error";
    selectedPath?: string | null;
    sidePanelOpen?: boolean;
    unsaved?: boolean;
    sync?: SyncStatus;
    banner?: ReactNode;
    body?: ReactNode;
};

function MainScreen({
    notes = sampleNotes,
    listStatus = "ready",
    selectedPath = "Weekly plan.md",
    sidePanelOpen = true,
    unsaved = false,
    sync = "synced",
    banner,
    body,
}: MainScreenProps) {
    const hasNote =
        selectedPath !== null && listStatus === "ready" && notes.length > 0;
    const showSidePanel = hasNote && sidePanelOpen;

    return (
        <AppShell
            titleBar={
                <TitleBar
                    tabs={
                        hasNote
                            ? openNotes.map((tab) => ({
                                  ...tab,
                                  unsaved: unsaved && tab.id === selectedPath,
                              }))
                            : []
                    }
                    activeTabId={hasNote ? selectedPath : undefined}
                    sidebarOpen
                    sidePanelOpen={showSidePanel}
                    windowControls={windowControls}
                    onSelectTab={noop}
                    onCloseTab={noop}
                    onNewNote={noop}
                    onToggleSidebar={noop}
                    onToggleSidePanel={noop}
                />
            }
            activityBar={
                <ActivityBar
                    items={sections}
                    footerItems={footerSections}
                    activeId="notes"
                    onSelect={noop}
                />
            }
            sidebar={
                <NoteSidebar workspaceName={workspaceName} onNewNote={noop}>
                    <NoteList
                        label="Notes"
                        notes={notes}
                        selectedPath={selectedPath}
                        onSelect={noop}
                        status={listStatus}
                        empty={
                            <EmptyState
                                headingAs="h3"
                                title="Create your first note"
                                description="Notes are saved as Markdown files in this folder."
                            />
                        }
                        error={
                            <ErrorState
                                title="Could not read the folder"
                                description="Check that it still exists and that you can read it."
                                action={
                                    <Button variant="secondary">
                                        Try again
                                    </Button>
                                }
                            />
                        }
                    />
                </NoteSidebar>
            }
            sidePanel={
                showSidePanel ? (
                    <SidePanel title="Outline" onClose={noop} onSearch={noop}>
                        <p className="p-panel text-size-ui-small text-text-muted">
                            No headings found.
                        </p>
                    </SidePanel>
                ) : undefined
            }
            statusBar={
                <StatusBar
                    trailing={
                        <>
                            <StatusIndicator status={sync} />
                            {hasNote ? <span>1,204 words</span> : null}
                        </>
                    }
                />
            }
        >
            {hasNote ? (
                <article className="mx-auto flex w-full max-w-note flex-col gap-note-block px-note-x py-section">
                    {banner}
                    {body ?? <NoteBody />}
                </article>
            ) : (
                <div className="p-section text-text-muted">
                    Select a note to start writing.
                </div>
            )}
        </AppShell>
    );
}

const meta = {
    title: "Screens/E00-S01 Main screen",
    tags: ["!autodocs"],
    parameters: {
        layout: "fullscreen",
        docs: { disable: true },
        a11y: {
            config: {
                rules: [{ id: "aria-required-children", enabled: false }],
            },
        },
    },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MainScreenOpenNote: Story = {
    name: "Main screen, note open",
    render: () => <MainScreen />,
};

export const NoNoteSelected: Story = {
    render: () => <MainScreen selectedPath={null} />,
};

export const SyncError: Story = {
    render: () => <MainScreen sync="error" />,
};

export const ConflictWithTheFileOnDisk: Story = {
    render: () => (
        <MainScreen
            banner={
                <NoteBanner
                    kind="conflict"
                    onKeepMine={noop}
                    onLoadFromDisk={noop}
                />
            }
        />
    ),
};

export const LoadingTheList: Story = {
    render: () => <MainScreen listStatus="loading" selectedPath={null} />,
};

export const ListCouldNotBeRead: Story = {
    render: () => <MainScreen listStatus="error" selectedPath={null} />,
};

export const SidePanelClosed: Story = {
    render: () => <MainScreen sidePanelOpen={false} />,
};

export const UnsavedChange: Story = {
    render: () => <MainScreen unsaved />,
};

export const Tablet768: Story = {
    globals: { viewport: { value: "tablet" } },
    render: () => <MainScreen sidePanelOpen={false} />,
};
