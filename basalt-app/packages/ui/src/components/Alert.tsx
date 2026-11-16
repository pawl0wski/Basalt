import { CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { IconButton } from "./IconButton";

const variants = {
    info: { Icon: Info, icon: "text-icon-default", role: "status" },
    warning: {
        Icon: TriangleAlert,
        icon: "text-status-warning",
        role: "status",
    },
    danger: { Icon: CircleAlert, icon: "text-status-danger", role: "alert" },
} as const;

type AlertProps = {
    variant?: keyof typeof variants;
    role?: "alert" | "status";
    title?: ReactNode;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
    onDismiss?: () => void;
    dismissLabel?: string;
};

function Alert({
    variant = "info",
    role,
    title,
    children,
    action,
    className,
    onDismiss,
    dismissLabel,
}: AlertProps) {
    const { Icon, icon, role: defaultRole } = variants[variant];

    return (
        <div
            role={role ?? defaultRole}
            data-variant={variant}
            className={cn(
                "bs-alert flex gap-between-groups rounded-container border border-border-divider bg-surface-raised p-panel text-size-ui text-text-ui",
                className,
            )}
        >
            <Icon
                aria-hidden="true"
                className={cn("size-icon shrink-0", icon)}
            />
            <div className="flex flex-1 flex-col gap-in-group">
                {title ? <p className="font-ui-strong">{title}</p> : null}
                <div>{children}</div>
                {action ? <div className="pt-in-group">{action}</div> : null}
            </div>
            {onDismiss && dismissLabel ? (
                <IconButton
                    aria-label={dismissLabel}
                    tooltip={false}
                    onClick={onDismiss}
                    className="shrink-0"
                >
                    <X aria-hidden="true" />
                </IconButton>
            ) : null}
        </div>
    );
}

export { Alert };
export type { AlertProps };
