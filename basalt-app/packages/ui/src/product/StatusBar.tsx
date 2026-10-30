import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import type { SaveState } from "./SaveStatus";
import { SaveStatus } from "./SaveStatus";

type StatusBarProps = {
    wordCount?: number;
    characterCount?: number;
    saveState?: SaveState;
    trailing?: ReactNode;
    className?: string;
};

function StatusBar({
    wordCount,
    characterCount,
    saveState,
    trailing,
    className,
}: StatusBarProps) {
    const counts = [
        wordCount === undefined
            ? null
            : `${wordCount.toLocaleString("en")} words`,
        characterCount === undefined
            ? null
            : `${characterCount.toLocaleString("en")} characters`,
    ].filter(Boolean);

    return (
        <div
            className={cn(
                "bs-status-bar flex h-status-bar items-center justify-between gap-between-groups overflow-hidden bg-surface-frame px-between-groups text-size-ui-small text-text-muted",
                className,
            )}
        >
            <span className="truncate">{counts.join(" · ")}</span>
            <span className="flex shrink-0 items-center gap-between-groups">
                {trailing}
                {saveState ? <SaveStatus state={saveState} /> : null}
            </span>
        </div>
    );
}

export { StatusBar };
export type { StatusBarProps };
