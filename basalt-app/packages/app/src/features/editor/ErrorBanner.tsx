import type { ReactNode } from "react";
import { Alert } from "@basalt/ui";

export type ErrorBannerProps = {
    title: string;
    message: string;
    variant?: "danger" | "warning";
    action?: ReactNode;
};

export function ErrorBanner({
    title,
    message,
    variant = "danger",
    action,
}: ErrorBannerProps) {
    return (
        <div className="sticky top-none z-10 pb-between-groups">
            <Alert variant={variant} role="alert" title={title} action={action}>
                {message}
            </Alert>
        </div>
    );
}
