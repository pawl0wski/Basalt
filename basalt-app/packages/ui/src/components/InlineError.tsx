import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type InlineErrorProps = {
    children: ReactNode;
    className?: string;
};

function InlineError({ children, className }: InlineErrorProps) {
    return (
        <p
            role="alert"
            className={cn(
                "bs-inline-error m-none flex items-start gap-in-group text-size-ui-small text-status-danger",
                className,
            )}
        >
            <CircleAlert aria-hidden="true" className="size-icon shrink-0" />
            <span>{children}</span>
        </p>
    );
}

export { InlineError };
export type { InlineErrorProps };
