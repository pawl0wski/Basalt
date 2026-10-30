import type { ReactNode } from "react";

type Example = {
    children: ReactNode;
    reason: string;
};

type DoDontProps = {
    good: Example;
    bad: Example;
};

function Side({ kind, example }: { kind: "Do" | "Don't"; example: Example }) {
    return (
        <figure className="m-none flex flex-1 flex-col gap-between-groups border border-border-divider bg-surface-editor p-panel rounded-container">
            <div className="flex flex-wrap items-center gap-between-groups">{example.children}</div>
            <figcaption className="text-size-ui text-text-ui">
                <strong className={kind === "Do" ? "font-ui-strong text-text-note" : "font-ui-strong text-status-danger"}>
                    {kind}.
                </strong>{" "}
                {example.reason}
            </figcaption>
        </figure>
    );
}

export function DoDont({ good, bad }: DoDontProps) {
    return (
        <div className="flex flex-col gap-between-groups font-text tablet:flex-row">
            <Side kind="Do" example={good} />
            <Side kind="Don't" example={bad} />
        </div>
    );
}
