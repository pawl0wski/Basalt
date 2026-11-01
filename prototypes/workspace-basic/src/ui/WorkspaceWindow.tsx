import {
    ActivityBar,
    EmptyState,
    StatusBar,
    TitleBar,
    AppShell,
    useToast,
} from "@basalt/ui";
import type { SaveState } from "@basalt/ui";
import { Bookmark, Files, Search, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { noteName } from "../model/names";
import { isDirty } from "../model/reducer";
import { useStore } from "../model/store";
import { Collapsible } from "./Collapsible";
import { Dialogs } from "./Dialogs";
import { NoteView } from "./NoteView";
import { OutlinePanel } from "./OutlinePanel";
import { Sidebar } from "./Sidebar";

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

const saveStates: Record<string, SaveState> = {
    saved: "saved",
    saving: "saving",
    pending: "unsaved",
    paused: "unsaved",
};

function ToastBridge() {
    const { state, dispatch } = useStore();
    const toast = useToast();
    const pending = state.toast;
    useEffect(() => {
        if (!pending) return;
        toast({ title: pending.title });
        dispatch({ type: "dismiss-toast" });
    }, [pending, toast, dispatch]);
    return null;
}

export function WorkspaceWindow() {
    const { state, dispatch } = useStore();
    const toast = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
    const active = state.tabs.find((tab) => tab.path === state.active);

    const newNote = () => dispatch({ type: "quick-note", folder: "" });

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
            if (state.dialog) return;
            const key = event.key.toLowerCase();
            if (key === "o") {
                event.preventDefault();
                dispatch({ type: "request-change-workspace" });
            } else if (key === "n") {
                event.preventDefault();
                dispatch({ type: "quick-note", folder: "" });
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [dispatch, state.dialog]);

    return (
        <>
            <AppShell
                titleBar={
                    <div
                        className="contents"
                        onMouseDown={(event) => {
                            if (
                                event.button === 1 &&
                                (event.target as HTMLElement).closest(
                                    ".bs-note-tab",
                                )
                            )
                                event.preventDefault();
                        }}
                        onAuxClick={(event) => {
                            if (event.button !== 1) return;
                            const tab = (event.target as HTMLElement).closest(
                                ".bs-note-tab",
                            );
                            if (!tab) return;
                            const index = Array.from(
                                event.currentTarget.querySelectorAll(
                                    ".bs-note-tab",
                                ),
                            ).indexOf(tab);
                            const path = state.tabs[index]?.path;
                            if (path === undefined) return;
                            event.preventDefault();
                            dispatch({ type: "request-close-tab", path });
                        }}
                    >
                        <TitleBar
                            tabs={state.tabs.map((tab) => ({
                                id: tab.path,
                                name: noteName(tab.path),
                                unsaved: isDirty(tab),
                            }))}
                            activeTabId={state.active ?? undefined}
                            sidebarOpen={sidebarOpen}
                            sidePanelOpen={panelOpen}
                            onSelectTab={(path) =>
                                dispatch({ type: "select-tab", path })
                            }
                            onCloseTab={(path) =>
                                dispatch({ type: "request-close-tab", path })
                            }
                            onNewNote={newNote}
                            windowControls={{
                                onMinimize: () =>
                                    toast({
                                        title: "Minimize does not work in the prototype",
                                    }),
                                onToggleMaximize: () =>
                                    toast({
                                        title: "Maximize does not work in the prototype",
                                    }),
                                onClose: () =>
                                    dispatch({
                                        type: "request-close-workspace",
                                    }),
                            }}
                            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                            onToggleSidePanel={() => setPanelOpen(!panelOpen)}
                        />
                    </div>
                }
                activityBar={
                    <ActivityBar
                        items={sections}
                        footerItems={footerSections}
                        activeId="notes"
                        onSelect={(id) => {
                            if (id !== "notes")
                                toast({
                                    title: `${sections.concat(footerSections).find((s) => s.id === id)?.label} does not work in the prototype`,
                                    description:
                                        "No material for epic E01 describes this section.",
                                });
                        }}
                    />
                }
                sidebar={
                    <Collapsible open={sidebarOpen} side="left">
                        <Sidebar />
                    </Collapsible>
                }
                sidePanel={
                    <Collapsible open={panelOpen} side="right">
                        <OutlinePanel>
                            <p className="p-panel text-text-muted">
                                The note outline is not part of epic E01 and
                                does not work in the prototype.
                            </p>
                        </OutlinePanel>
                    </Collapsible>
                }
                statusBar={
                    <StatusBar
                        saveState={active ? saveStates[active.save] : undefined}
                    />
                }
            >
                {active ? (
                    <NoteView tab={active} />
                ) : (
                    <EmptyState
                        title="No note selected"
                        description="Select a note to start writing."
                    />
                )}
            </AppShell>
            <Dialogs />
            <ToastBridge />
        </>
    );
}
