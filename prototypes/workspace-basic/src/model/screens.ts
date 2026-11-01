import type { ScreenId } from "./types";

export type ScreenInfo = {
    id: ScreenId;
    name: string;
    stories: string;
};

export const SCREENS: ScreenInfo[] = [
    { id: "s01", name: "Welcome", stories: "E01-S01" },
    { id: "s02", name: "Workspace, no note open", stories: "E01-S01" },
    { id: "s03", name: "Note editor", stories: "E01-S01" },
    { id: "s04", name: "New note (instant)", stories: "E01-S01, E01-S04" },
    { id: "s05", name: "Save-failed dialog", stories: "E01-S01" },
    { id: "s06", name: "Discard-edits confirmation", stories: "E01-S01" },
    { id: "s07", name: "Note with images", stories: "E01-S03" },
    { id: "s08", name: "Add images", stories: "E01-S03" },
    { id: "s09", name: "Folder tree", stories: "E01-S04" },
    { id: "s10", name: "Item actions menu", stories: "E01-S04" },
    { id: "s11", name: "Rename dialog", stories: "E01-S04" },
    { id: "s12", name: "New folder dialog", stories: "E01-S04" },
    { id: "s13", name: "Delete note confirmation", stories: "E01-S04" },
    { id: "s14", name: "Move note by dragging", stories: "E01-S04" },
];
