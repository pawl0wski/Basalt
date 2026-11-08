import { CircleSmall, FileText, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { IconButton } from "../components/IconButton";
import { cn } from "../lib/utils";

type NoteTabProps = {
    name: string;
    active: boolean;
    unsaved?: boolean;
    tabbable?: boolean;
    onSelect: () => void;
    onClose: () => void;
};

function NoteTab({
    name,
    active,
    unsaved,
    tabbable = active,
    onSelect,
    onClose,
}: NoteTabProps) {
    const tabRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (active) {
            tabRef.current?.scrollIntoView?.({
                block: "nearest",
                inline: "nearest",
            });
        }
    }, [active]);

    return (
        <li
            ref={tabRef}
            role="presentation"
            onMouseDown={(event) => {
                if (event.button === 1) event.preventDefault();
            }}
            onAuxClick={(event) => {
                if (event.button !== 1) return;
                event.preventDefault();
                onClose();
            }}
            data-active={active ? "" : undefined}
            className={cn(
                "bs-note-tab group relative flex h-icon-button min-w-note-tab-min max-w-note-tab-max items-center rounded-control",
                active ? "bg-surface-editor" : "hover:bg-state-hover",
            )}
        >
            <button
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={tabbable ? 0 : -1}
                onClick={onSelect}
                className={cn(
                    "flex h-full min-w-none flex-1 items-center gap-in-group rounded-control pl-between-groups pr-in-group text-left motion-feedback focus-visible:focus-ring",
                    active
                        ? "text-text-note"
                        : "text-text-muted hover:text-text-ui",
                )}
            >
                <FileText
                    aria-hidden="true"
                    className="size-icon shrink-0 text-icon-default"
                />
                <span className="truncate">
                    {name}
                    {unsaved ? (
                        <span className="sr-only">not saved</span>
                    ) : null}
                </span>
            </button>
            <span className="relative mr-in-group flex shrink-0 items-center">
                <IconButton
                    aria-label={`Close ${name}`}
                    tooltip={false}
                    onClick={onClose}
                    className={cn(
                        unsaved &&
                            "[&_svg]:hidden group-focus-within:[&_svg]:block group-hover:[&_svg]:block",
                    )}
                >
                    <X aria-hidden="true" />
                </IconButton>
                {unsaved ? (
                    <span
                        aria-hidden="true"
                        data-unsaved-dot=""
                        className="pointer-events-none absolute inset-none flex items-center justify-center group-focus-within:hidden group-hover:hidden"
                    >
                        <CircleSmall className="size-icon fill-current text-icon-active" />
                    </span>
                ) : null}
            </span>
            {active ? (
                <span
                    aria-hidden="true"
                    className="absolute inset-x-none bottom-none h-tab-indicator bg-action-primary"
                />
            ) : null}
        </li>
    );
}

export { NoteTab };
export type { NoteTabProps };
