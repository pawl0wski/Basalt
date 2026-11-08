import { useStore } from "zustand";
import { useServices } from "../../useServices";
import { isDirty } from "../notes/notes-store";
import type { AppWindowTabs } from "../window/AppWindow";
import { noteTitle } from "./note-title";

export function useNoteTabs(): AppWindowTabs {
    const { notesStore, notesActions, leaveActions } = useServices();
    const openNotes = useStore(notesStore, (state) => state.openNotes);
    const activeNote = useStore(notesStore, (state) => state.activeNote);

    return {
        tabs: openNotes.map((session) => ({
            id: session.path,
            name: noteTitle(session.path),
            unsaved: isDirty(session),
        })),
        activeTabId: activeNote ?? undefined,
        onSelectTab: (id) => {
            const session = openNotes.find((note) => note.path === id);
            if (session) void notesActions.openNote(session.path);
        },
        onCloseTab: (id) => {
            const session = openNotes.find((note) => note.path === id);
            if (session) void leaveActions.closeTab(session.path);
        },
    };
}
