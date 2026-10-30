import type { KeyboardEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "../lib/utils";
import { Skeleton } from "../components/Skeleton";

type NoteListEntry = {
    path: string;
    name: string;
};

type NoteListProps = {
    label: string;
    notes: NoteListEntry[];
    selectedPath?: string | null;
    onSelect: (path: string) => void;
    status?: "ready" | "loading" | "error";
    loadingLabel?: string;
    empty?: ReactNode;
    error?: ReactNode;
    className?: string;
};

function folderOf(path: string) {
    const slash = path.lastIndexOf("/");
    return slash === -1 ? "" : path.slice(0, slash + 1);
}

function NoteList({
    label,
    notes,
    selectedPath = null,
    onSelect,
    status = "ready",
    loadingLabel = "Loading notes",
    empty,
    error,
    className,
}: NoteListProps) {
    const refs = useRef<(HTMLLIElement | null)[]>([]);
    const selectedIndex = notes.findIndex((note) => note.path === selectedPath);
    const [focusIndex, setFocusIndex] = useState<number | null>(null);
    const tabStop = Math.min(focusIndex ?? Math.max(selectedIndex, 0), notes.length - 1);

    if (status === "loading") {
        return (
            <div
                role="status"
                aria-busy="true"
                className={cn("flex flex-col gap-in-group p-panel", className)}
            >
                <span className="sr-only">{loadingLabel}</span>
                <Skeleton className="h-tree-row" />
                <Skeleton className="h-tree-row" />
                <Skeleton className="h-tree-row" />
                <Skeleton className="h-tree-row" />
            </div>
        );
    }

    if (status === "error") return <div className={className}>{error}</div>;
    if (notes.length === 0) return <div className={className}>{empty}</div>;

    const move = (index: number) => {
        const next = (index + notes.length) % notes.length;
        setFocusIndex(next);
        refs.current[next]?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
        if (event.key === "ArrowDown") move(index + 1);
        else if (event.key === "ArrowUp") move(index - 1);
        else if (event.key === "Home") move(0);
        else if (event.key === "End") move(notes.length - 1);
        else if (event.key === "Enter" || event.key === " ") onSelect(notes[index].path);
        else return;
        event.preventDefault();
    };

    return (
        <ul
            role="listbox"
            aria-label={label}
            className={cn("bs-note-list m-none flex list-none flex-col p-none", className)}
        >
            {notes.map((note, index) => {
                const folder = folderOf(note.path);
                return (
                    <li
                        key={note.path}
                        ref={(element) => {
                            refs.current[index] = element;
                        }}
                        role="option"
                        aria-selected={note.path === selectedPath}
                        tabIndex={index === tabStop ? 0 : -1}
                        onClick={() => {
                            setFocusIndex(index);
                            onSelect(note.path);
                        }}
                        onFocus={() => setFocusIndex(index)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className="bs-note-list-item group relative flex h-tree-row cursor-default items-center gap-in-group px-between-groups text-size-ui text-text-ui motion-feedback hover:bg-state-hover focus-visible:focus-ring aria-selected:bg-state-selected"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute inset-y-none left-none hidden w-tree-indicator bg-action-primary group-aria-selected:block"
                        />
                        {folder ? <span className="shrink-0 text-text-muted">{folder}</span> : null}
                        <span className="truncate">{note.name}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export { NoteList };
export type { NoteListEntry, NoteListProps };
