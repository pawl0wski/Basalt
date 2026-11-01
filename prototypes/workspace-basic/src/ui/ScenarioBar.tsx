import { useState } from "react";
import type { ChangeEvent } from "react";
import { useStore } from "../model/store";
import type {
    AttachWrite,
    Clipboard,
    DeleteResult,
    DropFiles,
    FolderState,
    ImageState,
    Launch,
    Listing,
    MoveResult,
    NextSave,
    NoteOpen,
    PickerResult,
    Watcher,
} from "../model/types";

type Option<T extends string> = { value: T; label: string };

function Select<T extends string>({
    id,
    label,
    value,
    options,
    onChange,
    disabled,
}: {
    id: string;
    label: string;
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
    disabled?: boolean;
}) {
    return (
        <label htmlFor={id}>
            {label}
            <select
                id={id}
                value={value}
                disabled={disabled}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    onChange(event.target.value as T)
                }
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Action({
    label,
    onClick,
    disabled,
    pressed,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    pressed?: boolean;
}) {
    return (
        <button
            type="button"
            className="btn btn-outline"
            disabled={disabled}
            aria-pressed={pressed}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

const launch: Option<Launch>[] = [
    { value: "none", label: "No last workspace" },
    { value: "restore", label: "Last workspace restores" },
    { value: "missing", label: "Last workspace missing" },
    { value: "slow", label: "Restore is slow" },
];
const picker: Option<PickerResult>[] = [
    { value: "W1", label: "Picks W1 Basalt notes" },
    { value: "W2", label: "Picks W2 Empty notes" },
    { value: "W3", label: "Picks W3 Read-only archive" },
    { value: "W4", label: "Picks W4 Big vault (500 notes)" },
    { value: "cancel", label: "Picker cancelled" },
    { value: "unopenable", label: "Folder cannot be opened" },
];
const listing: Option<Listing>[] = [
    { value: "instant", label: "Instant" },
    { value: "slow", label: "Slow" },
    { value: "error", label: "Read error" },
];
const watcher: Option<Watcher>[] = [
    { value: "live", label: "Live" },
    { value: "unavailable", label: "Cannot start (focus fallback)" },
];
const folder: Option<FolderState>[] = [
    { value: "present", label: "Present" },
    { value: "lost", label: "Deleted or renamed while open" },
];
const nextSave: Option<NextSave>[] = [
    { value: "ok", label: "Succeeds" },
    { value: "denied", label: "Fails: permission denied" },
    { value: "fail-once", label: "Fails once, then succeeds" },
];
const external: Option<"edit" | "delete" | "move">[] = [
    { value: "edit", label: "Edit on disk" },
    { value: "delete", label: "Delete on disk" },
    { value: "move", label: "Move on disk" },
];
const openAs: Option<NoteOpen>[] = [
    { value: "ok", label: "Opens normally" },
    { value: "too-large", label: "Too large (5.2 MiB)" },
    { value: "not-utf8", label: "Not UTF-8" },
    { value: "symlink", label: "Symlink" },
    { value: "unknown", label: "Unknown error" },
];
const imageFiles = [
    "attachments/Roadmap diagram.png",
    "attachments/Photo 001.JPG",
    "attachments/Scan.heic",
    "attachments/Huge.png",
    "attachments/Broken.png",
].map((path) => ({ value: path, label: path.replace("attachments/", "") }));
const imageStates: Option<ImageState | "missing">[] = [
    { value: "ok", label: "OK" },
    { value: "missing", label: "Missing" },
    { value: "unreadable", label: "Unreadable" },
    { value: "unsupported", label: "Unsupported" },
    { value: "too-large", label: "Too large" },
    { value: "corrupt", label: "Corrupt" },
];
const clipboard: Option<Clipboard>[] = [
    { value: "png", label: "Screenshot PNG" },
    { value: "text", label: "Text only" },
    { value: "text-image", label: "Text plus image" },
    { value: "path", label: "Copied file path" },
];
const drop: Option<DropFiles>[] = [
    { value: "one", label: "1 image" },
    { value: "two", label: "2 images" },
    { value: "two-pdf", label: "2 images and a PDF" },
    { value: "large", label: "Image over 20 MiB" },
    { value: "heic", label: "HEIC" },
    { value: "outside", label: "Drop outside the editor" },
];
const attach: Option<AttachWrite>[] = [
    { value: "ok", label: "OK" },
    { value: "write-fails", label: "Write fails" },
    { value: "is-file", label: "attachments is a file" },
    { value: "slow", label: "Slow (large file)" },
    { value: "race", label: "Same name appears" },
];
const deleteResult: Option<DeleteResult>[] = [
    { value: "trash", label: "Moved to trash" },
    { value: "no-trash", label: "OS trash unavailable" },
    { value: "fails", label: "Fails" },
];
const moveResult: Option<MoveResult>[] = [
    { value: "ok", label: "OK, links untouched" },
    { value: "links", label: "OK, links rewritten" },
    { value: "halfway", label: "Fails halfway" },
];
const openCount: Option<"one" | "several" | "many">[] = [
    { value: "one", label: "One" },
    { value: "several", label: "Several" },
    { value: "many", label: "More than fit (12)" },
];

function formatClock(clock: number) {
    const date = new Date(clock);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function ScenarioBar() {
    const { state, dispatch } = useStore();
    const { scenario, workspace } = state;
    const [expanded, setExpanded] = useState(() => window.innerWidth >= 768);
    const [change, setChange] = useState<"edit" | "delete" | "move">("edit");
    const [image, setImage] = useState(imageFiles[0].value);
    const [count, setCount] = useState<"one" | "several" | "many">("several");
    const set = (patch: Partial<typeof scenario>) =>
        dispatch({ type: "set-scenario", patch });
    const open = workspace !== null;
    const entry = workspace?.files[image];
    const imageValue: ImageState | "missing" =
        entry?.kind === "image" ? entry.state : "missing";

    if (!expanded)
        return (
            <div className="scenario-bar">
                <button
                    type="button"
                    className="btn btn-outline"
                    aria-expanded="false"
                    onClick={() => setExpanded(true)}
                >
                    Show scenario controls
                </button>
            </div>
        );

    return (
        <div
            className="scenario-bar"
            role="group"
            aria-label="Scenario controls"
        >
            <button
                type="button"
                className="btn btn-outline"
                aria-expanded="true"
                onClick={() => setExpanded(false)}
            >
                Hide scenario controls
            </button>
            <Select
                id="sw01"
                label="Launch (sw01)"
                value={scenario.launch}
                options={launch}
                onChange={(value) => set({ launch: value })}
            />
            <Select
                id="sw02"
                label="Folder picker result (sw02)"
                value={scenario.picker}
                options={picker}
                onChange={(value) => set({ picker: value })}
            />
            <Select
                id="sw03"
                label="Note list loading (sw03)"
                value={scenario.listing}
                options={listing}
                onChange={(value) => set({ listing: value })}
            />
            <Select
                id="sw04"
                label="File watcher (sw04)"
                value={scenario.watcher}
                options={watcher}
                onChange={(value) => set({ watcher: value })}
            />
            <div className="scenario-group">
                <Action
                    label="Add a note on disk"
                    disabled={!open}
                    onClick={() => dispatch({ type: "external", kind: "add" })}
                />
                <Action
                    label="Remove a note on disk"
                    disabled={!open}
                    onClick={() =>
                        dispatch({ type: "external", kind: "remove" })
                    }
                />
                <Action
                    label="Return to window"
                    disabled={!open || scenario.watcher === "live"}
                    onClick={() => dispatch({ type: "window-focus" })}
                />
            </div>
            <Select
                id="sw05"
                label="Workspace folder (sw05)"
                value={scenario.folder}
                options={folder}
                disabled={!open}
                onChange={(value) => set({ folder: value })}
            />
            <Select
                id="sw06"
                label="Folder permission (sw06)"
                value={
                    scenario.readOnly || workspace?.readOnly
                        ? "read-only"
                        : "writable"
                }
                options={[
                    { value: "writable", label: "Writable" },
                    { value: "read-only", label: "Read-only" },
                ]}
                onChange={(value) =>
                    dispatch({
                        type: "toggle-readonly",
                        readOnly: value === "read-only",
                    })
                }
            />
            <Select
                id="sw07"
                label="Next save (sw07)"
                value={scenario.nextSave}
                options={nextSave}
                onChange={(value) => set({ nextSave: value })}
            />
            <div className="scenario-group">
                <Select
                    id="sw08"
                    label="External change to the open note (sw08)"
                    value={change}
                    options={external}
                    disabled={!open}
                    onChange={setChange}
                />
                <Action
                    label="Apply change"
                    disabled={!open}
                    onClick={() => dispatch({ type: "external", kind: change })}
                />
            </div>
            <Select
                id="sw09"
                label="Notes open as (sw09)"
                value={scenario.openAs}
                options={openAs}
                onChange={(value) => set({ openAs: value })}
            />
            <div className="scenario-group">
                <Select
                    id="sw10-file"
                    label="Demo image file (sw10)"
                    value={image}
                    options={imageFiles}
                    disabled={!open}
                    onChange={setImage}
                />
                <Select
                    id="sw10-state"
                    label="State of the file"
                    value={imageValue}
                    options={imageStates}
                    disabled={!open}
                    onChange={(value) =>
                        dispatch({
                            type: "set-image",
                            path: image,
                            state: value,
                        })
                    }
                />
                <Action
                    label={
                        scenario.imagesSlow
                            ? "Images load: slowly"
                            : "Images load: at once"
                    }
                    pressed={scenario.imagesSlow}
                    onClick={() => set({ imagesSlow: !scenario.imagesSlow })}
                />
            </div>
            <div className="scenario-group">
                <Select
                    id="sw11"
                    label="Clipboard at the next paste (sw11)"
                    value={scenario.clipboard}
                    options={clipboard}
                    onChange={(value) => set({ clipboard: value })}
                />
                <Action
                    label="Simulate paste"
                    disabled={!open}
                    onClick={() => dispatch({ type: "paste" })}
                />
            </div>
            <div className="scenario-group">
                <Select
                    id="sw12"
                    label="Files at the next drop (sw12)"
                    value={scenario.drop}
                    options={drop}
                    onChange={(value) => set({ drop: value })}
                />
                <Action
                    label="Drag over the editor"
                    disabled={!open || !state.active}
                    pressed={state.dragOver}
                    onClick={() =>
                        dispatch({ type: "drag-over", on: !state.dragOver })
                    }
                />
                <Action
                    label="Simulate drop"
                    disabled={!open}
                    onClick={() => dispatch({ type: "drop" })}
                />
            </div>
            <Select
                id="sw13"
                label="Writing into attachments (sw13)"
                value={scenario.attach}
                options={attach}
                onChange={(value) => set({ attach: value })}
            />
            <Select
                id="sw14"
                label="Delete result (sw14)"
                value={scenario.deleteResult}
                options={deleteResult}
                onChange={(value) => set({ deleteResult: value })}
            />
            <Select
                id="sw15"
                label="Move result (sw15)"
                value={scenario.moveResult}
                options={moveResult}
                onChange={(value) => set({ moveResult: value })}
            />
            <div className="scenario-group">
                <span className="t-hint">
                    Clock (sw16): {formatClock(state.clock)}
                </span>
                <Action
                    label="Advance one second"
                    onClick={() => dispatch({ type: "advance-clock" })}
                />
            </div>
            <Select
                id="sw18"
                label="Open notes (sw18)"
                value={count}
                options={openCount}
                disabled={!open}
                onChange={(value) => {
                    setCount(value);
                    dispatch({ type: "open-notes", mode: value });
                }}
            />
            <Action
                label="Reset (sw17)"
                onClick={() => dispatch({ type: "reset" })}
            />
            <p role="status" className="t-hint">
                {open
                    ? ""
                    : "Controls that need an open workspace are disabled until you open one. "}
                {open && !state.active
                    ? "Dragging over the editor needs an open note. "
                    : ""}
                {state.simResult}
            </p>
        </div>
    );
}
