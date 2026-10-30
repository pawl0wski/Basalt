import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

type ErrorStateProps = {
    title: ReactNode;
    description: ReactNode;
    action?: ReactNode;
    details?: string;
};

function ErrorState({ title, description, action, details }: ErrorStateProps) {
    return (
        <EmptyState
            role="alert"
            title={title}
            description={description}
            action={action}
            icon={<CircleAlert aria-hidden="true" className="text-status-danger" />}
        >
            {details ? (
                <pre
                    tabIndex={0}
                    className="m-none max-w-full overflow-x-auto rounded-control bg-code-block-bg p-panel font-code text-size-code text-text-ui focus-visible:focus-ring"
                >
                    {details}
                </pre>
            ) : null}
        </EmptyState>
    );
}

export { ErrorState };
export type { ErrorStateProps };
