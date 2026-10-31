import type { ElementType, ReactNode } from "react";
import { useId } from "react";
import { cn } from "../lib/utils";

type CardProps = {
    heading?: ReactNode;
    headingAs?: "h2" | "h3" | "h4";
    children: ReactNode;
    className?: string;
};

function Card({ heading, headingAs = "h2", children, className }: CardProps) {
    const headingId = useId();
    const Heading: ElementType = headingAs;

    return (
        <section
            aria-labelledby={heading ? headingId : undefined}
            className={cn(
                "bs-card flex flex-col gap-between-groups",
                className,
            )}
        >
            {heading ? (
                <Heading
                    id={headingId}
                    className="font-ui-strong text-size-ui text-text-ui"
                >
                    {heading}
                </Heading>
            ) : null}
            <div className="flex flex-col divide-y divide-border-divider rounded-container border border-border-divider bg-surface-card">
                {children}
            </div>
        </section>
    );
}

type CardRowProps = {
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
};

function CardRow({ title, description, children }: CardRowProps) {
    return (
        <div className="bs-card-row flex flex-col gap-between-groups p-settings-card tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="flex flex-col gap-in-group">
                <p className="text-size-ui text-text-ui">{title}</p>
                {description ? (
                    <p className="text-size-ui-small text-text-muted">
                        {description}
                    </p>
                ) : null}
            </div>
            {children ? <div className="shrink-0">{children}</div> : null}
        </div>
    );
}

export { Card, CardRow };
export type { CardProps, CardRowProps };
