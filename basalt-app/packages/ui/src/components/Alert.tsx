import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

const variants = {
    info: { Icon: Info, icon: "text-icon-default", role: "status" },
    warning: { Icon: TriangleAlert, icon: "text-status-warning", role: "status" },
    danger: { Icon: CircleAlert, icon: "text-status-danger", role: "alert" },
} as const;

type AlertProps = {
    variant?: keyof typeof variants;
    title?: ReactNode;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
};

function Alert({
    variant = "info",
    title,
    children,
    action,
    className,
}: AlertProps) {
    const { Icon, icon, role } = variants[variant];

    return (
        <div
            role={role}
            data-variant={variant}
            className={cn(
                "bs-alert flex gap-between-groups rounded-container border border-border-divider bg-surface-raised p-panel text-size-ui text-text-ui",
                className,
            )}
        >
            <Icon aria-hidden="true" className={cn("size-icon shrink-0", icon)} />
            <div className="flex flex-col gap-in-group">
                {title ? <p className="font-ui-strong">{title}</p> : null}
                <div>{children}</div>
                {action ? <div className="pt-in-group">{action}</div> : null}
            </div>
        </div>
    );
}

export { Alert };
export type { AlertProps };
