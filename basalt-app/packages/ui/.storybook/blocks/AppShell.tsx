import type { ReactNode } from "react";

type AppShellProps = {
    sidebar?: ReactNode;
    statusBar?: ReactNode;
    children: ReactNode;
};

export function AppShell({ sidebar, statusBar, children }: AppShellProps) {
    return (
        <div className="flex h-screen w-full flex-col bg-surface-editor font-text text-size-ui text-text-ui">
            <div className="flex min-h-none flex-1">
                {sidebar ? (
                    <div className="shrink-0 border-r border-border-divider">
                        {sidebar}
                    </div>
                ) : null}
                <main
                    tabIndex={0}
                    className="min-w-none flex-1 overflow-y-auto focus-visible:focus-ring"
                >
                    {children}
                </main>
            </div>
            {statusBar}
        </div>
    );
}
