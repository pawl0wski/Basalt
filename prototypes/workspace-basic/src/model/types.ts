export const SCREEN_IDS = [
    "s01",
    "s02",
    "s03",
    "s04",
    "s05",
    "s06",
    "s07",
    "s08",
    "s09",
    "s10",
    "s11",
    "s12",
    "s13",
    "s14",
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];

export type ImageState =
    "ok" | "unreadable" | "unsupported" | "too-large" | "corrupt";

export type NoteOpen = "ok" | "too-large" | "not-utf8" | "symlink" | "unknown";

export type Entry =
    | { kind: "folder" }
    | { kind: "note"; text: string; open: NoteOpen }
    | {
          kind: "image";
          state: ImageState;
          width?: number;
          height?: number;
          src?: string;
      };

export type Files = Record<string, Entry>;

export type WorkspaceId = "W1" | "W2" | "W3" | "W4" | "W5";

export type Workspace = {
    id: WorkspaceId;
    name: string;
    files: Files;
    readOnly: boolean;
};

export type SaveState = "saved" | "pending" | "saving" | "paused";

export type TabBanner =
    "permission-denied" | "conflict" | "deleted" | "workspace-lost";

export type Tab = {
    path: string;
    text: string;
    savedText: string;
    save: SaveState;
    rev: number;
    banner: TabBanner | null;
    open: NoteOpen;
    cursor: number;
    loading: boolean;
};

export type ExitIntent =
    | { kind: "close-tab"; path: string }
    | { kind: "close-workspace" }
    | { kind: "open-workspace"; id: WorkspaceId };

export type Dialog =
    | {
          kind: "new-folder";
          parent: string;
          name: string;
          error?: string;
          pending?: boolean;
      }
    | {
          kind: "rename";
          path: string;
          name: string;
          error?: string;
          pending?: boolean;
      }
    | { kind: "delete"; paths: string[] }
    | {
          kind: "save-failed";
          path: string;
          reason: string;
          retryFailed: boolean;
          intent: ExitIntent;
      }
    | {
          kind: "discard-edits";
          path: string;
          action: "load-from-disk" | "close";
      };

export type PickerResult = "W1" | "W2" | "W3" | "W4" | "cancel" | "unopenable";

export type NextSave = "ok" | "denied" | "fail-once";

export type Launch = "none" | "restore" | "missing" | "slow";
export type Listing = "instant" | "slow" | "error";
export type Watcher = "live" | "unavailable";
export type FolderState = "present" | "lost";
export type Clipboard = "png" | "text" | "text-image" | "path";
export type DropFiles =
    "one" | "two" | "two-pdf" | "large" | "heic" | "outside";
export type AttachWrite = "ok" | "write-fails" | "is-file" | "slow" | "race";
export type DeleteResult = "trash" | "no-trash" | "fails";
export type MoveResult = "ok" | "links" | "halfway";

export type Scenario = {
    launch: Launch;
    picker: PickerResult;
    listing: Listing;
    watcher: Watcher;
    folder: FolderState;
    readOnly: boolean;
    nextSave: NextSave;
    openAs: NoteOpen;
    imagesSlow: boolean;
    clipboard: Clipboard;
    drop: DropFiles;
    attach: AttachWrite;
    deleteResult: DeleteResult;
    moveResult: MoveResult;
};

export type Toast = { id: number; title: string };

export type AppState = {
    screen: ScreenId;
    workspace: Workspace | null;
    notice: string | null;
    tabs: Tab[];
    active: string | null;
    dialog: Dialog | null;
    expanded: string[];
    scenario: Scenario;
    clock: number;
    toast: Toast | null;
    status: string;
    flush: ExitIntent | null;
    hint: ScreenId | null;
    menuFor: string | null;
    drag: { paths: string[]; over: string | null } | null;
    selection: string[];
    anchor: string | null;
    sidebarNotice: string | null;
    listStatus: "ready" | "loading" | "error";
    listSnapshot: string[] | null;
    restoring: boolean;
    simResult: string;
    addNotice: string | null;
    adding: { count: number; notice: string | null } | null;
    dragOver: boolean;
    externalCount: number;
};
