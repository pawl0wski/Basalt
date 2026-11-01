import type { ScreenId } from "./types";

export type ScreenNote = {
    stories: string;
    simulated: string;
    undecided: string;
};

export const SCREEN_NOTES: Record<ScreenId, ScreenNote> = {
    s01: {
        stories:
            "E01-S01 (#8): AC-01.1. States: default, workspace lost, picker cancelled, folder cannot be opened, restoring at launch.",
        simulated:
            "The operating system folder picker. The result comes from the review bar (sw02). Restoring the last workspace is simulated by sw01.",
        undecided:
            "Text for a folder that cannot be opened (GAP-10) and for the restoring state (GAP-11, DSG-09).",
    },
    s02: {
        stories:
            "E01-S01 (#8): AC-01.1, AC-01.3, AC-01.7 to AC-01.9, AC-01.20. States: tree, empty workspace, loading, read error, watcher fallback notice, external changes, read-only workspace. The header shows the workspace folder name, without a Change workspace button (Ctrl/Cmd+O opens the picker). The sidebar collapses with an animation.",
        simulated:
            "The file system, the file watcher and the read-only permission (sw03 to sw06). The activity bar and the outline panel are shown but do not work.",
        undecided:
            "Not in epic E01: the activity bar sections and the outline panel (shown inert), and counts in the status bar (left out). No sync word (decided). The list loading and error texts (GAP-10, GAP-11). Change workspace will move to Settings when settings are built.",
    },
    s03: {
        stories:
            "E01-S01 (#8): AC-01.2, AC-01.3, AC-01.11, AC-01.12, AC-01.15, AC-01.16, AC-01.18, AC-01.19. States: saved, saving, not saved, conflict, deleted or moved, read-only, too large, not UTF-8, tabs. Banners are as wide as the text and stay at the top while the note scrolls. The line with the cursor shows its Markdown source in place, with no visible input.",
        simulated:
            "The disk, autosave (1 000 ms, then 250 ms of Saving) and changes made by another program (sw07 to sw09). The editor is a stand-in with live preview.",
        undecided:
            "Banners for symlinks, unknown errors and a lost folder (GAP-12, GAP-13). The editor itself belongs to @basalt/editor (DSG-01, GAP-30). Pending and paused both show Not saved (decided).",
    },
    s04: {
        stories:
            "E01-S01 (#8): AC-01.10. E01-S04 (#16): AC-04.4. There is no dialog: New note (sidebar button, title bar button, Ctrl/Cmd+N, or the folder menu) creates Untitled at once, in the root or in the chosen folder, and opens it. The owner renames or moves it later.",
        simulated: "The read-only failure (sw06), shown as a sidebar message.",
        undecided: "Which New note control is canonical (GAP-25).",
    },
    s05: {
        stories:
            "E01-S01 (#8): AC-01.3. States: reason, Retry fails again, Escape means Cancel.",
        simulated:
            "A failing save (sw07, sw06) and a lost folder (sw05). It appears when a tab, the window or the workspace is closed with text that cannot be saved.",
        undecided: "Closing a tab with unsaved text (GAP-21).",
    },
    s06: {
        stories:
            "E01-S01 (#8): AC-01.3 (text is never lost silently). States: Load version from disk, Close note.",
        simulated: "A change or deletion by another program (sw08).",
        undecided:
            "Texts proposed in the S01 spec (AC-01.14); Cancel has the initial focus.",
    },
    s07: {
        stories:
            "E01-S03 (#10): AC-03.1, AC-03.3. States: image, loading, not found, unreadable, unsupported, too large, remote, invalid, corrupt.",
        simulated:
            "The image files and their states (sw10). The demo images are neutral drawings. Loading is shown for all images while the switch is on.",
        undecided:
            "Texts for loading and corrupt images (GAP-16, DSG-07). That another editor can open the note (GAP-01) cannot be shown here: the source is visible instead.",
    },
    s08: {
        stories:
            "E01-S03 (#10): AC-03.1, AC-03.2. States: paste, drop, suffix in the same second, sub-folder link, skipped files, notice, read-only.",
        simulated:
            "The clipboard, the dropped files and the write into attachments (sw11 to sw13) and the clock (sw16). The buttons in the review bar replace paste and drop.",
        undecided:
            "Feedback while a large file is written (GAP-17, DSG-10). How the notice is dismissed, replaced and cleared (GAP-18, DSG-06).",
    },
    s09: {
        stories:
            "E01-S04 (#16): AC-04.6 to AC-04.8. States: collapsed and expanded folders, empty folder, loading, read error, live changes, read-only. A note in a folder is shown under its folder, and rows have the same style at every depth. Ctrl/Cmd+click and Shift+click select several notes (AC-04.10).",
        simulated:
            "The workspace and its folders. There is no S04 spec: this screen follows the criteria and the owner's folder-tree direction.",
        undecided:
            "Whether expansion is remembered (GAP-05), what the tree lists: attachments and other files are hidden here (GAP-06). Tree component and styling (DSG-02, DSG-12).",
    },
    s10: {
        stories:
            "E01-S04 (#16): AC-04.1 to AC-04.4, AC-04.7, AC-04.9, AC-04.11. States: note menu, folder menu, workspace menu, menu for several selected notes (Delete only).",
        simulated:
            "The menu opens with a right-click on a row, or with Shift+F10 or the Menu key on the focused row. Rows have no button for it.",
        undecided: "The context menu component (DSG-03).",
    },
    s11: {
        stories:
            "E01-S04 (#16): AC-04.1, AC-04.7. States: prefilled name, collision, invalid name, renaming, rename fails.",
        simulated: "The rename on disk (300 ms) and the read-only failure.",
        undecided:
            "Name rules for renames (GAP-19), a case-only change of the note's own name and an unchanged name (GAP-09), an unsaved note (GAP-02), the dialog itself (DSG-04).",
    },
    s12: {
        stories:
            "E01-S04 (#16): AC-04.3, AC-04.7. States: empty name, taken or invalid name, creating, create fails.",
        simulated: "Creating the folder and the read-only failure.",
        undecided:
            "Name rules for folders (GAP-19). Renaming, moving or deleting a folder is not offered (GAP-07).",
    },
    s13: {
        stories:
            'E01-S04 (#16): AC-04.2, AC-04.7, AC-04.12. States: question, cancel, confirmed, toast, trash unavailable, fails, read-only. With several notes selected the question is "Delete N notes?" and one confirmation deletes them all.',
        simulated:
            "The operating system trash (sw14). There is no Undo in epic E01.",
        undecided:
            "What happens without a trash (GAP-23). What is shown after the note closes (GAP-20). Deleting an open note with unsaved text (GAP-02): the dialog warns that the text is lost.",
    },
    s14: {
        stories:
            "E01-S04 (#16): AC-04.5, AC-04.7, AC-04.13. States: dragging, drop target, moved, name exists, read-only. Dragging one of several selected notes moves all of them; a name clash on any of them moves none.",
        simulated:
            "Dragging uses the browser's drag and drop. Link rewriting is switched by sw15.",
        undecided:
            "Dropping on the root or the note's own folder is handled; moving several notes at once, a keyboard way to move and Escape rules are not decided (GAP-31). Link rewriting (GAP-08). Drag styling (DSG-12).",
    },
};
