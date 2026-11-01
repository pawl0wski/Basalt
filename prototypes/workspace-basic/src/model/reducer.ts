import {
    attachmentPath,
    pastedImageName,
    relativeLink,
    rewriteImageLinks,
} from "./markdown";
import {
    baseName,
    folderOf,
    joinPath,
    nameKey,
    noteName,
    stripExtension,
    suggestNoteName,
    validateName,
} from "./names";
import type {
    AppState,
    Dialog,
    Entry,
    ExitIntent,
    Files,
    ImageState,
    NextSave,
    NoteOpen,
    PickerResult,
    Scenario,
    ScreenId,
    Tab,
    Workspace,
    WorkspaceId,
} from "./types";
import {
    DEMO_NOW,
    PASTED_IMAGE_SRC,
    ROADMAP_IMAGE_SRC,
    createWorkspace,
} from "./workspaces";

export const SAVE_DEBOUNCE_MS = 1000;
export const SAVING_MS = 250;
export const SLOW_MS = 1200;
export const PENDING_MS = 300;

export const defaultScenario: Scenario = {
    launch: "none",
    picker: "W1",
    listing: "instant",
    watcher: "live",
    folder: "present",
    readOnly: false,
    nextSave: "ok",
    openAs: "ok",
    imagesSlow: false,
    clipboard: "png",
    drop: "one",
    attach: "ok",
    deleteResult: "trash",
    moveResult: "ok",
};

export const pickerFailure =
    "Basalt could not open the folder you chose. Check that you have access to it and that it is available, then try again.";

const READ_ONLY_ERROR =
    "The workspace folder is read-only. Nothing was changed.";

export function initialState(scenario: Scenario = defaultScenario): AppState {
    return {
        screen: "s01",
        workspace: null,
        notice: null,
        tabs: [],
        active: null,
        dialog: null,
        expanded: [],
        scenario,
        clock: DEMO_NOW,
        toast: null,
        status: "",
        flush: null,
        hint: null,
        menuFor: null,
        drag: null,
        selection: [],
        anchor: null,
        sidebarNotice: null,
        listStatus: "ready",
        listSnapshot: null,
        restoring: false,
        simResult: "",
        addNotice: null,
        adding: null,
        dragOver: false,
        externalCount: 0,
    };
}

export type Action =
    | { type: "reset" }
    | { type: "enter-screen"; screen: ScreenId }
    | { type: "set-scenario"; patch: Partial<Scenario> }
    | { type: "pick-workspace" }
    | { type: "restore-done" }
    | { type: "list-loaded" }
    | { type: "reload-list" }
    | { type: "note-loaded"; path: string }
    | { type: "request-change-workspace" }
    | { type: "request-close-workspace" }
    | { type: "open-note"; path: string }
    | { type: "select-tab"; path: string }
    | { type: "request-close-tab"; path: string }
    | { type: "edit"; path: string; text: string }
    | { type: "set-cursor"; path: string; line: number }
    | { type: "save-start"; path: string }
    | { type: "save-finish"; path: string }
    | { type: "retry-save"; path: string }
    | { type: "save-again"; path: string }
    | { type: "close-deleted"; path: string }
    | { type: "open-dialog"; dialog: Dialog }
    | { type: "close-dialog" }
    | { type: "dialog-name"; name: string }
    | { type: "submit-dialog" }
    | { type: "complete-submit" }
    | { type: "save-failed-retry" }
    | { type: "save-failed-discard" }
    | { type: "toggle-folder"; path: string }
    | { type: "move"; paths: string[]; to: string }
    | {
          type: "select";
          path: string;
          mode: "set" | "toggle" | "range";
          visible: string[];
      }
    | { type: "clear-selection" }
    | { type: "drag"; drag: AppState["drag"] }
    | { type: "menu-open"; path: string }
    | { type: "quick-note"; folder: string }
    | { type: "confirm-discard" }
    | { type: "keep-mine"; path: string }
    | { type: "dismiss-toast" }
    | { type: "paste" }
    | { type: "drop" }
    | { type: "add-complete" }
    | { type: "dismiss-add-notice" }
    | { type: "drag-over"; on: boolean }
    | { type: "advance-clock" }
    | { type: "set-image"; path: string; state: ImageState | "missing" }
    | { type: "open-notes"; mode: "one" | "several" | "many" }
    | {
          type: "external";
          kind: "edit" | "delete" | "move" | "add" | "remove";
      }
    | { type: "window-focus" }
    | { type: "toggle-readonly"; readOnly: boolean };

const externalActions = new Set<Action["type"]>(["external"]);

export function isDirty(tab: Tab) {
    return tab.text !== tab.savedText;
}

export function saveFailureReason(state: AppState) {
    if (state.scenario.folder === "lost")
        return "The workspace folder no longer exists.";
    return state.workspace?.readOnly
        ? "The workspace folder is read-only."
        : "The workspace folder is not writable.";
}

function makeTab(
    path: string,
    entry: Extract<Entry, { kind: "note" }>,
    openAs: NoteOpen,
    loading: boolean,
): Tab {
    const open = entry.open !== "ok" ? entry.open : openAs;
    const text = open === "ok" ? entry.text : "";
    return {
        path,
        text,
        savedText: text,
        save: "saved",
        rev: 0,
        banner: null,
        open,
        cursor: 0,
        loading,
    };
}

function listStatusFor(scenario: Scenario): AppState["listStatus"] {
    if (scenario.listing === "slow") return "loading";
    if (scenario.listing === "error") return "error";
    return "ready";
}

export function openWorkspaceState(state: AppState, id: WorkspaceId): AppState {
    const workspace = createWorkspace(id);
    const scenario: Scenario = { ...state.scenario, folder: "present" };
    return {
        ...state,
        scenario,
        workspace: {
            ...workspace,
            readOnly: workspace.readOnly || scenario.readOnly,
        },
        notice: null,
        tabs: [],
        active: null,
        dialog: null,
        expanded: [],
        status: "",
        flush: null,
        menuFor: null,
        drag: null,
        sidebarNotice: null,
        toast: null,
        restoring: false,
        listStatus: listStatusFor(scenario),
        listSnapshot:
            scenario.watcher === "unavailable"
                ? Object.keys(workspace.files)
                : null,
        addNotice: null,
        adding: null,
        dragOver: false,
    };
}

function restoredState(state: AppState): AppState {
    const opened = openWorkspaceState(state, "W1");
    const files = opened.workspace?.files ?? {};
    const tabs = ["Meeting notes.md", "Weekly plan.md"].flatMap((path) => {
        const entry = files[path];
        return entry?.kind === "note"
            ? [makeTab(path, entry, "ok", false)]
            : [];
    });
    return { ...opened, tabs, active: "Weekly plan.md" };
}

export function bootState(scenario: Scenario): AppState {
    const base = initialState(scenario);
    switch (scenario.launch) {
        case "none":
            return base;
        case "missing":
            return {
                ...base,
                notice: `The last workspace "${createWorkspace("W5").name}" no longer exists. Choose a folder to continue.`,
            };
        case "restore":
            return restoredState(base);
        case "slow":
            return { ...base, restoring: true };
    }
}

function closeWorkspaceState(state: AppState): AppState {
    return {
        ...state,
        workspace: null,
        tabs: [],
        active: null,
        dialog: null,
        flush: null,
        menuFor: null,
        drag: null,
        sidebarNotice: null,
        toast: null,
        listSnapshot: null,
        addNotice: null,
        adding: null,
        dragOver: false,
    };
}

function closeTabState(state: AppState, path: string): AppState {
    const index = state.tabs.findIndex((tab) => tab.path === path);
    if (index === -1) return state;
    const tabs = state.tabs.filter((tab) => tab.path !== path);
    const active =
        state.active === path
            ? ((tabs[index] ?? tabs[index - 1] ?? null)?.path ?? null)
            : state.active;
    return {
        ...state,
        tabs,
        active,
        dialog: null,
        flush: null,
        addNotice: null,
    };
}

function lostNotice(state: AppState) {
    return `The workspace folder "${state.workspace?.name ?? ""}" was deleted or renamed. Choose it again to continue.`;
}

function finishIntent(state: AppState, intent: ExitIntent): AppState {
    switch (intent.kind) {
        case "close-tab":
            return closeTabState(state, intent.path);
        case "close-workspace": {
            const notice =
                state.scenario.folder === "lost" ? lostNotice(state) : null;
            return { ...closeWorkspaceState(state), notice };
        }
        case "open-workspace":
            return openWorkspaceState(closeWorkspaceState(state), intent.id);
    }
}

function attempt(state: AppState, intent: ExitIntent): AppState {
    const relevant =
        intent.kind === "close-tab"
            ? state.tabs.filter((tab) => tab.path === intent.path)
            : state.tabs;
    const dirty = relevant.find(isDirty);
    if (!dirty) return finishIntent(state, intent);
    if (dirty.save === "paused") {
        return {
            ...state,
            flush: intent,
            dialog: {
                kind: "save-failed",
                path: dirty.path,
                reason: saveFailureReason(state),
                retryFailed: false,
                intent,
            },
        };
    }
    return {
        ...state,
        flush: intent,
        tabs: state.tabs.map((tab) =>
            tab.path === dirty.path ? { ...tab, save: "saving" } : tab,
        ),
    };
}

function patchTab(
    state: AppState,
    path: string,
    patch: Partial<Tab>,
): AppState {
    return {
        ...state,
        tabs: state.tabs.map((tab) =>
            tab.path === path ? { ...tab, ...patch } : tab,
        ),
    };
}

function writeFailure(
    workspace: Workspace,
    scenario: Scenario,
): { failed: boolean; nextSave: NextSave } {
    if (
        scenario.folder === "lost" ||
        workspace.readOnly ||
        scenario.nextSave === "denied"
    )
        return { failed: true, nextSave: scenario.nextSave };
    if (scenario.nextSave === "fail-once")
        return { failed: true, nextSave: "ok" };
    return { failed: false, nextSave: scenario.nextSave };
}

function finishSave(state: AppState, path: string): AppState {
    const tab = state.tabs.find((candidate) => candidate.path === path);
    if (!tab || !state.workspace || tab.save !== "saving") return state;
    const outcome = writeFailure(state.workspace, state.scenario);
    const scenario = { ...state.scenario, nextSave: outcome.nextSave };
    if (outcome.failed) {
        let next = patchTab({ ...state, scenario }, path, {
            save: "paused",
            banner:
                state.scenario.folder === "lost"
                    ? "workspace-lost"
                    : "permission-denied",
        });
        if (next.flush) {
            next = {
                ...next,
                dialog: {
                    kind: "save-failed",
                    path,
                    reason: saveFailureReason(next),
                    retryFailed:
                        state.dialog?.kind === "save-failed" &&
                        state.dialog.path === path,
                    intent: next.flush,
                },
            };
        }
        return next;
    }
    const files: Files = {
        ...state.workspace.files,
        [path]: { kind: "note", text: tab.text, open: "ok" },
    };
    let next = patchTab(
        { ...state, scenario, workspace: { ...state.workspace, files } },
        path,
        { savedText: tab.text, save: "saved", banner: null },
    );
    const intent = next.flush;
    if (intent) next = attempt({ ...next, dialog: null }, intent);
    return next;
}

function siblingNames(files: Files, folder: string, kind: "note" | "folder") {
    return Object.entries(files)
        .filter(
            ([path, entry]) =>
                folderOf(path) === folder &&
                (kind === "folder"
                    ? entry.kind === "folder"
                    : entry.kind === "note"),
        )
        .map(([path]) => (kind === "note" ? noteName(path) : baseName(path)));
}

function dialogError(state: AppState, dialog: Dialog): string | undefined {
    const files = state.workspace?.files ?? {};
    switch (dialog.kind) {
        case "new-folder":
            return validateName(
                dialog.name,
                siblingNames(files, dialog.parent, "folder"),
                "folder",
            );
        case "rename": {
            const own = noteName(dialog.path);
            const taken = siblingNames(
                files,
                folderOf(dialog.path),
                "note",
            ).filter((name) => name !== own);
            if (dialog.name.trim() === own) return undefined;
            return validateName(dialog.name, taken, "note");
        }
        default:
            return undefined;
    }
}

export function suggestedName(state: AppState, folder: string) {
    return suggestNoteName(
        siblingNames(state.workspace?.files ?? {}, folder, "note"),
    );
}

function expandWith(state: AppState, folder: string): string[] {
    const parts = folder ? folder.split("/") : [];
    const expanded = new Set(state.expanded);
    parts.forEach((_, index) =>
        expanded.add(parts.slice(0, index + 1).join("/")),
    );
    return [...expanded];
}

function rekey(files: Files, from: string, to: string): Files {
    const next: Files = {};
    for (const [path, entry] of Object.entries(files))
        next[path === from ? to : path] = entry;
    return next;
}

function renameTab(state: AppState, from: string, to: string): AppState {
    return {
        ...state,
        tabs: state.tabs.map((tab) =>
            tab.path === from ? { ...tab, path: to } : tab,
        ),
        active: state.active === from ? to : state.active,
    };
}

function submitDialog(state: AppState): AppState {
    const dialog = state.dialog;
    if (!dialog || (dialog.kind !== "new-folder" && dialog.kind !== "rename"))
        return state;
    const error = dialogError(state, dialog);
    if (error) return { ...state, dialog: { ...dialog, error } };
    if (
        dialog.kind === "rename" &&
        dialog.name.trim() === noteName(dialog.path)
    )
        return { ...state, dialog: null };
    return { ...state, dialog: { ...dialog, pending: true, error: undefined } };
}

function completeDialog(state: AppState): AppState {
    const dialog = state.dialog;
    const workspace = state.workspace;
    if (!dialog || !workspace) return state;
    if (dialog.kind === "new-folder") {
        if (workspace.readOnly)
            return {
                ...state,
                dialog: {
                    ...dialog,
                    pending: false,
                    error: `Could not create the folder. ${READ_ONLY_ERROR}`,
                },
            };
        const path = joinPath(dialog.parent, dialog.name.trim());
        return {
            ...state,
            workspace: {
                ...workspace,
                files: { ...workspace.files, [path]: { kind: "folder" } },
            },
            dialog: null,
            expanded: expandWith(state, dialog.parent),
        };
    }
    if (dialog.kind === "rename") {
        if (workspace.readOnly)
            return {
                ...state,
                dialog: {
                    ...dialog,
                    pending: false,
                    error: `Could not rename the note. ${READ_ONLY_ERROR}`,
                },
            };
        const to = joinPath(folderOf(dialog.path), `${dialog.name.trim()}.md`);
        return renameTab(
            {
                ...state,
                workspace: {
                    ...workspace,
                    files: rekey(workspace.files, dialog.path, to),
                },
                dialog: null,
            },
            dialog.path,
            to,
        );
    }
    if (dialog.kind === "delete") {
        const many = dialog.paths.length > 1;
        const noun = many ? "notes" : "note";
        const failure = workspace.readOnly
            ? `Could not delete the ${noun}. ${READ_ONLY_ERROR}`
            : state.scenario.deleteResult === "no-trash"
              ? `Could not delete the ${noun}: this system has no trash, and Basalt does not delete permanently. Nothing was deleted.`
              : state.scenario.deleteResult === "fails"
                ? `Could not move the ${noun} to the trash. Nothing was deleted.`
                : null;
        if (failure) return { ...state, dialog: null, sidebarNotice: failure };
        const files = { ...workspace.files };
        for (const path of dialog.paths) delete files[path];
        const closed = dialog.paths.reduce<AppState>(
            (current, path) => closeTabState(current, path),
            { ...state, workspace: { ...workspace, files } },
        );
        return {
            ...closed,
            dialog: null,
            selection: [],
            anchor: null,
            toast: {
                id: state.toast ? state.toast.id + 1 : 1,
                title: many
                    ? `${dialog.paths.length} notes moved to trash`
                    : `"${noteName(dialog.paths[0])}" moved to trash`,
            },
        };
    }
    return state;
}

function quickNote(state: AppState, folder: string): AppState {
    const workspace = state.workspace;
    if (!workspace) return state;
    if (workspace.readOnly)
        return {
            ...state,
            hint: "s04",
            sidebarNotice: `Could not create the note. ${READ_ONLY_ERROR}`,
        };
    const path = joinPath(folder, `${suggestedName(state, folder)}.md`);
    const entry: Entry = { kind: "note", text: "", open: "ok" };
    return {
        ...state,
        hint: "s04",
        workspace: {
            ...workspace,
            files: { ...workspace.files, [path]: entry },
        },
        tabs: [...state.tabs, makeTab(path, entry, "ok", false)],
        active: path,
        expanded: expandWith(state, folder),
        addNotice: null,
        sidebarNotice: null,
        selection: [],
        anchor: null,
    };
}

function selectNotes(
    state: AppState,
    action: Extract<Action, { type: "select" }>,
): AppState {
    const files = state.workspace?.files ?? {};
    const isNote = (path: string) => files[path]?.kind === "note";
    if (!isNote(action.path)) return state;
    if (action.mode === "set")
        return { ...state, selection: [action.path], anchor: action.path };
    if (action.mode === "toggle") {
        const current =
            state.selection.length > 0
                ? state.selection
                : state.active && isNote(state.active)
                  ? [state.active]
                  : [];
        const selection = current.includes(action.path)
            ? current.filter((path) => path !== action.path)
            : [...current, action.path];
        return { ...state, selection, anchor: action.path };
    }
    const anchor = state.anchor ?? state.active ?? action.path;
    const from = action.visible.indexOf(anchor);
    const to = action.visible.indexOf(action.path);
    if (from === -1 || to === -1)
        return { ...state, selection: [action.path], anchor: action.path };
    const [start, end] = from < to ? [from, to] : [to, from];
    return {
        ...state,
        selection: action.visible.slice(start, end + 1).filter(isNote),
        anchor,
    };
}

function moveNotes(state: AppState, paths: string[], to: string): AppState {
    const workspace = state.workspace;
    if (!workspace) return state;
    const base: AppState = { ...state, drag: null, sidebarNotice: null };
    const moving = paths.filter((path) => folderOf(path) !== to);
    if (moving.length === 0) return base;
    const many = moving.length > 1;
    if (workspace.readOnly)
        return {
            ...base,
            sidebarNotice: `Could not move the ${many ? "notes" : "note"}. ${READ_ONLY_ERROR}`,
        };
    const taken = new Set(
        Object.keys(workspace.files)
            .filter(
                (other) =>
                    folderOf(other) === to &&
                    workspace.files[other].kind === "note",
            )
            .map((other) => nameKey(stripExtension(baseName(other)))),
    );
    for (const path of moving) {
        const name = stripExtension(baseName(path));
        if (taken.has(nameKey(name)))
            return {
                ...base,
                sidebarNotice: `A note named "${name}" already exists in that folder. Nothing was moved.`,
            };
        taken.add(nameKey(name));
    }
    let next: AppState = { ...base, selection: [], anchor: null };
    for (const path of moving) next = moveOne(next, path, to);
    const links = state.scenario.moveResult;
    const label = many
        ? `${moving.length} notes were moved.`
        : `"${stripExtension(baseName(moving[0]))}" was moved.`;
    const sidebarNotice =
        links === "links"
            ? `${label} ${many ? "Their" : "Its"} image links were updated.`
            : links === "halfway"
              ? `${label.slice(0, -1)}, but ${many ? "their" : "its"} image links could not be updated. Some images may show as not found.`
              : null;
    return { ...next, expanded: expandWith(state, to), sidebarNotice };
}

function moveOne(state: AppState, path: string, to: string): AppState {
    const workspace = state.workspace;
    if (!workspace) return state;
    const target = joinPath(to, baseName(path));
    let files = rekey(workspace.files, path, target);
    let tabs = state.tabs;
    if (state.scenario.moveResult === "links") {
        const entry = files[target];
        if (entry?.kind === "note")
            files = {
                ...files,
                [target]: {
                    ...entry,
                    text: rewriteImageLinks(entry.text, path, target),
                },
            };
        tabs = tabs.map((tab) => {
            if (tab.path !== path) return tab;
            const text = rewriteImageLinks(tab.text, path, target);
            const savedText = rewriteImageLinks(tab.savedText, path, target);
            return { ...tab, text, savedText };
        });
    }
    return renameTab(
        { ...state, workspace: { ...workspace, files }, tabs },
        path,
        target,
    );
}

function activeTab(state: AppState) {
    return state.tabs.find((tab) => tab.path === state.active);
}

function pushNotice(state: AppState, notice: string): AppState {
    return { ...state, addNotice: notice };
}

function insertText(state: AppState, text: string): AppState {
    const tab = activeTab(state);
    if (!tab) return state;
    const lines = tab.text.split("\n");
    const at = Math.min(tab.cursor, lines.length - 1);
    lines[at] = `${lines[at]}${text}`;
    return patchTab({ ...state, addNotice: null, hint: "s08" }, tab.path, {
        text: lines.join("\n"),
        rev: tab.rev + 1,
        save: tab.save === "paused" ? "paused" : "pending",
    });
}

function insertImages(
    state: AppState,
    count: number,
    notice: string | null,
): AppState {
    const workspace = state.workspace;
    const tab = activeTab(state);
    if (!workspace || !tab) return state;
    const files: Files = { ...workspace.files };
    if (!files.attachments) files.attachments = { kind: "folder" };
    const taken = Object.keys(files)
        .filter((path) => folderOf(path) === "attachments")
        .map((path) => baseName(path));
    if (state.scenario.attach === "race")
        taken.push(`${pastedImageName(state.clock, [])}.png`);
    const added: string[] = [];
    for (let index = 0; index < count; index += 1) {
        const name = pastedImageName(state.clock, taken);
        const path = attachmentPath(name);
        taken.push(`${name}.png`);
        files[path] = {
            kind: "image",
            state: "ok",
            width: 800,
            height: 450,
            src: PASTED_IMAGE_SRC,
        };
        added.push(`![${name}](${relativeLink(tab.path, path)})`);
    }
    const lines = tab.text.split("\n");
    const at = Math.min(tab.cursor, lines.length - 1);
    lines.splice(at + 1, 0, ...added);
    return patchTab(
        {
            ...state,
            workspace: { ...workspace, files },
            hint: "s08",
            adding: null,
            addNotice: notice,
            dragOver: false,
        },
        tab.path,
        {
            text: lines.join("\n"),
            rev: tab.rev + 1,
            save: tab.save === "paused" ? "paused" : "pending",
            cursor: at + added.length,
        },
    );
}

function addImages(
    state: AppState,
    count: number,
    skipped: string | null,
): AppState {
    const workspace = state.workspace;
    if (!workspace || !activeTab(state))
        return { ...state, simResult: "No note is open. Nothing happened." };
    if (workspace.readOnly)
        return pushNotice(
            state,
            `No image was added. ${READ_ONLY_ERROR} Nothing was inserted.`,
        );
    if (state.scenario.attach === "is-file")
        return pushNotice(
            state,
            'No image was added: a file named "attachments" already exists in the workspace, so the folder could not be created.',
        );
    if (state.scenario.attach === "write-fails")
        return pushNotice(
            state,
            "No image was added: the file could not be written to the attachments folder. Nothing was inserted.",
        );
    if (count === 0) return pushNotice(state, skipped ?? "No image was added.");
    const notice = skipped;
    if (state.scenario.attach === "slow")
        return {
            ...state,
            simResult: "",
            addNotice: null,
            adding: { count, notice },
        };
    return insertImages(state, count, notice);
}

function pasteClipboard(state: AppState): AppState {
    if (!activeTab(state) || !state.workspace)
        return { ...state, simResult: "No note is open. Nothing happened." };
    switch (state.scenario.clipboard) {
        case "png":
            return addImages(state, 1, null);
        case "text":
            return insertText(state, " Pasted text.");
        case "text-image":
            return insertText(state, " Pasted text with an image.");
        case "path":
            return insertText(state, " /home/owner/Pictures/photo.png");
    }
}

function dropFiles(state: AppState): AppState {
    if (state.scenario.drop === "outside")
        return {
            ...state,
            dragOver: false,
            simResult:
                "The files were dropped outside the editor. Nothing happened.",
        };
    if (!activeTab(state) || !state.workspace)
        return { ...state, simResult: "No note is open. Nothing happened." };
    switch (state.scenario.drop) {
        case "one":
            return addImages({ ...state, dragOver: false }, 1, null);
        case "two":
            return addImages({ ...state, dragOver: false }, 2, null);
        case "two-pdf":
            return addImages(
                { ...state, dragOver: false },
                2,
                "1 file was skipped: Report.pdf is not a supported image format.",
            );
        case "large":
            return addImages(
                { ...state, dragOver: false },
                0,
                "No image was added: Huge.png is too large (over 20 MiB).",
            );
        case "heic":
            return addImages(
                { ...state, dragOver: false },
                0,
                "No image was added: Scan.heic is not a supported image format.",
            );
    }
}

function externalChange(
    state: AppState,
    kind: "edit" | "delete" | "move" | "add" | "remove",
): AppState {
    const workspace = state.workspace;
    if (!workspace) return state;
    if (kind === "add" || kind === "remove") {
        const files = { ...workspace.files };
        if (kind === "add") {
            const count = state.externalCount + 1;
            files[`Added on disk ${count}.md`] = {
                kind: "note",
                text: `# Added on disk ${count}\n`,
                open: "ok",
            };
            return {
                ...state,
                workspace: { ...workspace, files },
                externalCount: count,
                simResult: "",
            };
        }
        const open = new Set(state.tabs.map((tab) => tab.path));
        const victim = Object.entries(files)
            .reverse()
            .find(([path, entry]) => entry.kind === "note" && !open.has(path));
        if (!victim) return { ...state, simResult: "No note can be removed." };
        delete files[victim[0]];
        return { ...state, workspace: { ...workspace, files }, simResult: "" };
    }
    const tab = activeTab(state);
    if (!tab)
        return {
            ...state,
            simResult: "No note is open. Open a note, then apply the change.",
        };
    const disk = workspace.files[tab.path];
    if (kind === "edit") {
        const text = `${disk?.kind === "note" ? disk.text : tab.savedText}\n\nEdited in another program.`;
        const files: Files = {
            ...workspace.files,
            [tab.path]: { kind: "note", text, open: "ok" },
        };
        const next = {
            ...state,
            workspace: { ...workspace, files },
            simResult: "",
        };
        if (isDirty(tab))
            return patchTab(next, tab.path, {
                save: "paused",
                banner: "conflict",
            });
        return patchTab(next, tab.path, {
            text,
            savedText: text,
            rev: tab.rev + 1,
        });
    }
    const files = { ...workspace.files };
    const entry = files[tab.path];
    delete files[tab.path];
    if (kind === "move" && entry)
        files[
            joinPath(folderOf(tab.path), `${noteName(tab.path)} (moved).md`)
        ] = entry;
    return patchTab(
        { ...state, workspace: { ...workspace, files }, simResult: "" },
        tab.path,
        { save: "paused", banner: "deleted" },
    );
}

function loseFolder(state: AppState): AppState {
    if (!state.workspace) return state;
    const dirty = state.tabs.filter(isDirty);
    if (dirty.length === 0)
        return { ...closeWorkspaceState(state), notice: lostNotice(state) };
    const tabs = state.tabs.map((tab) =>
        isDirty(tab)
            ? {
                  ...tab,
                  save: "paused" as const,
                  banner: "workspace-lost" as const,
              }
            : tab,
    );
    return attempt({ ...state, tabs }, { kind: "close-workspace" });
}

const hintFree = new Set<Action["type"]>([
    "set-cursor",
    "save-start",
    "save-finish",
    "edit",
    "dismiss-toast",
    "complete-submit",
    "dialog-name",
    "add-complete",
    "list-loaded",
    "note-loaded",
    "restore-done",
]);

export function deriveScreen(state: AppState): ScreenId {
    if (!state.workspace) return "s01";
    switch (state.dialog?.kind) {
        case "save-failed":
            return "s05";
        case "discard-edits":
            return "s06";
        case "rename":
            return "s11";
        case "new-folder":
            return "s12";
        case "delete":
            return "s13";
    }
    if (state.drag) return "s14";
    if (state.hint) return state.hint;
    const active = activeTab(state);
    if (!active) return "s02";
    return active.path === "demo/Images, all cases.md" ? "s07" : "s03";
}

export function listedFiles(state: AppState): Files {
    const files = state.workspace?.files ?? {};
    const snapshot = state.listSnapshot;
    if (!snapshot) return files;
    const listed = new Set(snapshot);
    return Object.fromEntries(
        Object.entries(files).filter(([path]) => listed.has(path)),
    );
}

export function reduce(
    state: AppState,
    action: Action,
    presets: (screen: ScreenId, state: AppState) => AppState,
): AppState {
    if (action.type === "enter-screen") return presets(action.screen, state);
    if (action.type === "reset") return bootState(defaultScenario);
    const base = hintFree.has(action.type)
        ? state
        : { ...state, hint: null, menuFor: null };
    let next = step(base, action);
    if (next === state) return state;
    if (
        next.workspace &&
        next.scenario.watcher === "unavailable" &&
        !externalActions.has(action.type)
    )
        next = { ...next, listSnapshot: Object.keys(next.workspace.files) };
    if (next.scenario.watcher === "live" && next.listSnapshot)
        next = { ...next, listSnapshot: null };
    return { ...next, screen: deriveScreen(next) };
}

function applyPicker(state: AppState, result: PickerResult): AppState {
    if (result === "cancel")
        return { ...state, status: "No folder was chosen. Nothing changed." };
    if (result === "unopenable")
        return { ...state, notice: pickerFailure, status: "" };
    return openWorkspaceState(state, result);
}

function setImage(
    state: AppState,
    path: string,
    value: ImageState | "missing",
): AppState {
    const workspace = state.workspace;
    if (!workspace) return state;
    const files = { ...workspace.files };
    if (value === "missing") delete files[path];
    else
        files[path] =
            value === "ok"
                ? {
                      kind: "image",
                      state: "ok",
                      width: 1200,
                      height: 800,
                      src: ROADMAP_IMAGE_SRC,
                  }
                : { kind: "image", state: value };
    return { ...state, workspace: { ...workspace, files } };
}

function openMany(state: AppState, mode: "one" | "several" | "many") {
    const workspace = state.workspace;
    if (!workspace) return { ...state, simResult: "Open a workspace first." };
    const notes = Object.entries(workspace.files)
        .filter(([, entry]) => entry.kind === "note" && entry.open === "ok")
        .map(([path]) => path)
        .sort();
    const picked =
        mode === "one"
            ? ["Weekly plan.md"]
            : mode === "several"
              ? ["Meeting notes.md", "Weekly plan.md"]
              : notes.slice(0, 12);
    const paths = picked.filter((path) => workspace.files[path]);
    const tabs = paths.flatMap((path) => {
        const entry = workspace.files[path];
        return entry?.kind === "note"
            ? [makeTab(path, entry, "ok", false)]
            : [];
    });
    return {
        ...state,
        tabs,
        active: tabs[tabs.length - 1]?.path ?? null,
        simResult: "",
        flush: null,
        dialog: null,
    };
}

function step(state: AppState, action: Action): AppState {
    switch (action.type) {
        case "set-scenario": {
            const scenario = { ...state.scenario, ...action.patch };
            const next = { ...state, scenario };
            if (action.patch.launch !== undefined)
                return bootState({ ...scenario, folder: "present" });
            if (action.patch.folder === "lost") return loseFolder(next);
            if (action.patch.listing !== undefined && state.workspace)
                return { ...next, listStatus: listStatusFor(scenario) };
            return next;
        }
        case "toggle-readonly": {
            const scenario = { ...state.scenario, readOnly: action.readOnly };
            return {
                ...state,
                scenario,
                workspace: state.workspace
                    ? {
                          ...state.workspace,
                          readOnly:
                              action.readOnly || state.workspace.id === "W3",
                      }
                    : null,
            };
        }
        case "pick-workspace":
            return applyPicker(state, state.scenario.picker);
        case "restore-done":
            return state.restoring ? restoredState(state) : state;
        case "list-loaded":
            return { ...state, listStatus: "ready" };
        case "reload-list":
            return { ...state, listStatus: listStatusFor(state.scenario) };
        case "note-loaded":
            return patchTab(state, action.path, { loading: false });
        case "request-change-workspace": {
            const result = state.scenario.picker;
            if (result === "cancel")
                return {
                    ...state,
                    status: "No folder was chosen. Nothing changed.",
                    simResult: "No folder was chosen. Nothing changed.",
                };
            if (result === "unopenable")
                return {
                    ...state,
                    simResult: pickerFailure,
                };
            return attempt(
                { ...state, status: "", simResult: "" },
                { kind: "open-workspace", id: result },
            );
        }
        case "request-close-workspace":
            return attempt(state, { kind: "close-workspace" });
        case "open-note": {
            const workspace = state.workspace;
            const entry = workspace?.files[action.path];
            if (!workspace || !entry || entry.kind !== "note") return state;
            if (state.tabs.some((tab) => tab.path === action.path))
                return {
                    ...state,
                    active: action.path,
                    addNotice: null,
                    selection: [],
                    anchor: null,
                };
            return {
                ...state,
                selection: [],
                anchor: null,
                tabs: [
                    ...state.tabs,
                    makeTab(
                        action.path,
                        entry,
                        state.scenario.openAs,
                        state.scenario.listing === "slow",
                    ),
                ],
                active: action.path,
                addNotice: null,
            };
        }
        case "select-tab":
            return { ...state, active: action.path, addNotice: null };
        case "request-close-tab":
            return attempt(state, { kind: "close-tab", path: action.path });
        case "edit": {
            const tab = state.tabs.find((t) => t.path === action.path);
            if (!tab) return state;
            const dirty = action.text !== tab.savedText;
            const save =
                tab.save === "paused" ? "paused" : dirty ? "pending" : "saved";
            return patchTab(state, action.path, {
                text: action.text,
                rev: tab.rev + 1,
                save,
            });
        }
        case "set-cursor":
            return patchTab(state, action.path, { cursor: action.line });
        case "save-start": {
            const tab = state.tabs.find((t) => t.path === action.path);
            if (!tab || tab.save !== "pending") return state;
            return patchTab(state, action.path, { save: "saving" });
        }
        case "save-finish":
            return finishSave(state, action.path);
        case "retry-save":
        case "save-again":
            return patchTab(state, action.path, {
                save: "saving",
                banner: null,
            });
        case "close-deleted": {
            const tab = state.tabs.find((t) => t.path === action.path);
            if (!tab) return state;
            if (isDirty(tab))
                return {
                    ...state,
                    dialog: {
                        kind: "discard-edits",
                        path: action.path,
                        action: "close",
                    },
                };
            return closeTabState(state, action.path);
        }
        case "open-dialog":
            return { ...state, dialog: action.dialog, sidebarNotice: null };
        case "close-dialog":
            return { ...state, dialog: null, flush: null };
        case "dialog-name": {
            const dialog = state.dialog;
            if (
                !dialog ||
                (dialog.kind !== "new-folder" && dialog.kind !== "rename")
            )
                return state;
            const updated = {
                ...dialog,
                name: action.name,
                error: undefined,
                pending: false,
            };
            return {
                ...state,
                dialog: { ...updated, error: dialogError(state, updated) },
            };
        }
        case "submit-dialog":
            return state.dialog?.kind === "delete"
                ? completeDialog(state)
                : submitDialog(state);
        case "complete-submit":
            return completeDialog(state);
        case "save-failed-retry": {
            const dialog = state.dialog;
            if (dialog?.kind !== "save-failed") return state;
            return patchTab({ ...state, flush: dialog.intent }, dialog.path, {
                save: "saving",
            });
        }
        case "save-failed-discard": {
            const dialog = state.dialog;
            if (dialog?.kind !== "save-failed") return state;
            const tab = state.tabs.find((t) => t.path === dialog.path);
            const reverted = patchTab(state, dialog.path, {
                text: tab?.savedText ?? "",
                save: "saved",
                banner: null,
                rev: (tab?.rev ?? 0) + 1,
            });
            return attempt({ ...reverted, dialog: null }, dialog.intent);
        }
        case "toggle-folder":
            return {
                ...state,
                hint: "s09",
                expanded: state.expanded.includes(action.path)
                    ? state.expanded.filter((path) => path !== action.path)
                    : [...state.expanded, action.path],
            };
        case "move":
            return moveNotes(state, action.paths, action.to);
        case "select":
            return selectNotes(state, action);
        case "clear-selection":
            return state.selection.length === 0
                ? state
                : { ...state, selection: [], anchor: null };
        case "drag":
            return { ...state, drag: action.drag };
        case "menu-open":
            return { ...state, hint: "s10" };
        case "quick-note":
            return quickNote(state, action.folder);
        case "keep-mine":
            return patchTab(state, action.path, {
                banner: null,
                save: "pending",
                rev:
                    (state.tabs.find((t) => t.path === action.path)?.rev ?? 0) +
                    1,
            });
        case "confirm-discard": {
            const dialog = state.dialog;
            if (dialog?.kind !== "discard-edits" || !state.workspace)
                return state;
            if (dialog.action === "close")
                return closeTabState(state, dialog.path);
            const disk = state.workspace.files[dialog.path];
            const text = disk?.kind === "note" ? disk.text : "";
            return patchTab({ ...state, dialog: null }, dialog.path, {
                text,
                savedText: text,
                save: "saved",
                banner: null,
            });
        }
        case "dismiss-toast":
            return { ...state, toast: null };
        case "paste":
            return pasteClipboard(state);
        case "drop":
            return dropFiles(state);
        case "add-complete":
            return state.adding
                ? insertImages(state, state.adding.count, state.adding.notice)
                : state;
        case "dismiss-add-notice":
            return { ...state, addNotice: null };
        case "drag-over":
            return { ...state, dragOver: action.on };
        case "advance-clock":
            return { ...state, clock: state.clock + 1000 };
        case "set-image":
            return setImage(state, action.path, action.state);
        case "open-notes":
            return openMany(state, action.mode);
        case "external":
            return externalChange(state, action.kind);
        case "window-focus":
            return state.workspace
                ? { ...state, listSnapshot: Object.keys(state.workspace.files) }
                : state;
        default:
            return state;
    }
}
