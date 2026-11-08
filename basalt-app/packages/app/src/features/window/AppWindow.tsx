import type { ReactNode } from "react";
import { AppShell, TitleBar, type WindowControlLabels } from "@basalt/ui";
import { SidebarCollapse } from "../workspace/SidebarCollapse";

export type AppWindowWorkspace = {
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    activityBar: ReactNode;
    sidebar: ReactNode;
    statusBar: ReactNode;
};

export type AppWindowProps = {
    title: string;
    labels: WindowControlLabels;
    maximized: boolean;
    onMinimize: () => void;
    onToggleMaximize: () => void;
    onClose: () => void;
    workspace?: AppWindowWorkspace;
    children: ReactNode;
};

export function AppWindow({
    title,
    labels,
    maximized,
    onMinimize,
    onToggleMaximize,
    onClose,
    workspace,
    children,
}: AppWindowProps) {
    return (
        <AppShell
            titleBar={
                <TitleBar
                    title={title}
                    sidebarOpen={workspace?.sidebarOpen}
                    onToggleSidebar={workspace?.onToggleSidebar}
                    windowControls={{
                        labels,
                        maximized,
                        onMinimize,
                        onToggleMaximize,
                        onClose,
                    }}
                />
            }
            activityBar={workspace?.activityBar}
            sidebar={
                workspace ? (
                    <SidebarCollapse open={workspace.sidebarOpen}>
                        {workspace.sidebar}
                    </SidebarCollapse>
                ) : undefined
            }
            statusBar={workspace?.statusBar}
        >
            {children}
        </AppShell>
    );
}
