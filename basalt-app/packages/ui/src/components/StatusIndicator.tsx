import { Check, CircleAlert, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "../lib/utils";

const statuses = {
    synced: { label: "Synced", Icon: Check, tone: "text-text-muted" },
    syncing: { label: "Syncing", Icon: RefreshCw, tone: "text-text-muted" },
    conflict: {
        label: "Sync conflict",
        Icon: TriangleAlert,
        tone: "text-status-warning",
    },
    error: { label: "Sync error", Icon: CircleAlert, tone: "text-status-danger" },
} as const;

type SyncStatus = keyof typeof statuses;

type StatusIndicatorProps = {
    status: SyncStatus;
    className?: string;
};

function StatusIndicator({ status, className }: StatusIndicatorProps) {
    const { label, Icon, tone } = statuses[status];

    return (
        <span
            role="status"
            data-status={status}
            className={cn(
                "bs-status-indicator inline-flex items-center gap-in-group text-size-ui-small",
                tone,
                className,
            )}
        >
            <Icon aria-hidden="true" className="size-icon" />
            {label}
        </span>
    );
}

export { StatusIndicator };
export type { StatusIndicatorProps, SyncStatus };
