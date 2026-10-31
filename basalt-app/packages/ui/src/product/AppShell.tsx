import type { ReactNode } from "react";

type AppShellProps = {
    titleBar?: ReactNode;
    activityBar?: ReactNode;
    sidebar?: ReactNode;
    sidePanel?: ReactNode;
    statusBar?: ReactNode;
    children: ReactNode;
};

function AppShell({
    titleBar,
    activityBar,
    sidebar,
    sidePanel,
    statusBar,
    children,
}: AppShellProps) {
    return (
        <div className="bs-app-shell flex h-screen w-full flex-col bg-surface-editor font-text text-size-ui text-text-ui">
            {titleBar ? (
                <div className="shrink-0 border-b border-border-divider">
                    {titleBar}
                </div>
            ) : null}
            <div className="flex min-h-none flex-1">
                {activityBar ? (
                    <div className="shrink-0 border-r border-border-divider">
                        {activityBar}
                    </div>
                ) : null}
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
                {sidePanel ? (
                    <div className="shrink-0 border-l border-border-divider">
                        {sidePanel}
                    </div>
                ) : null}
            </div>
            {statusBar}
        </div>
    );
}

export { AppShell };
export type { AppShellProps };
