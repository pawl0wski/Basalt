import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { cn } from "../lib/utils";

const states = {
    saved: { text: "Saved", Icon: Check, tone: "text-text-muted" },
    saving: { text: "Saving…", Icon: LoaderCircle, tone: "text-text-muted" },
    unsaved: {
        text: "Not saved",
        Icon: CircleAlert,
        tone: "text-status-warning",
    },
} as const;

type SaveState = keyof typeof states;

type SaveStatusProps = {
    state: SaveState;
    messages?: Partial<Record<SaveState, string>>;
    className?: string;
};

function SaveStatus({ state, messages, className }: SaveStatusProps) {
    const { text, Icon, tone } = states[state];

    return (
        <span
            role="status"
            data-state={state}
            className={cn(
                "bs-save-status inline-flex items-center gap-in-group text-size-ui-small",
                tone,
                className,
            )}
        >
            <Icon aria-hidden="true" className="size-icon" />
            {messages?.[state] ?? text}
        </span>
    );
}

export { SaveStatus };
export type { SaveState, SaveStatusProps };
