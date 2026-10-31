import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type EmptyStateProps = {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
    headingAs?: "h2" | "h3" | "h4";
    role?: "alert" | "status";
    children?: ReactNode;
    className?: string;
};

function EmptyState({
    title,
    description,
    action,
    icon,
    headingAs: Heading = "h2",
    role,
    children,
    className,
}: EmptyStateProps) {
    return (
        <div
            role={role}
            className={cn(
                "bs-empty-state flex max-w-prose flex-col items-start gap-between-groups p-section text-size-ui text-text-ui",
                className,
            )}
        >
            {icon ? (
                <span className="text-icon-default [&_svg]:size-activity-icon">
                    {icon}
                </span>
            ) : null}
            <div className="flex flex-col gap-in-group">
                <Heading className="font-ui-strong text-size-ui text-text-ui">
                    {title}
                </Heading>
                {description ? (
                    <p className="text-text-muted">{description}</p>
                ) : null}
            </div>
            {children}
            {action ? <div>{action}</div> : null}
        </div>
    );
}

export { EmptyState };
export type { EmptyStateProps };
