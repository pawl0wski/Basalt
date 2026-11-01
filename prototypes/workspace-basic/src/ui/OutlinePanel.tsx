import type { ReactNode } from "react";

export function OutlinePanel({ children }: { children: ReactNode }) {
    return (
        <aside
            data-gap="DSG-13"
            aria-label="Outline"
            className="bs-side-panel flex h-full w-sidebar shrink-0 flex-col bg-surface-card text-size-ui text-text-ui"
        >
            <div className="border-b border-border-divider p-panel">
                <p className="truncate font-ui-strong">Outline</p>
            </div>
            <div className="min-h-none flex-1 overflow-y-auto">{children}</div>
        </aside>
    );
}
