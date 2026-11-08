import type { ReactNode } from "react";
import {
    AppShell,
    TitleBar,
    type TitleBarTab,
    type WindowControlLabels,
} from "@basalt/ui";
import { SidebarCollapse } from "../workspace/SidebarCollapse";

export type AppWindowTabs = {
    tabs: TitleBarTab[];
    activeTabId?: string;
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
};

export type AppWindowWorkspace = {
    tabs?: AppWindowTabs;
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
                    tabs={workspace?.tabs?.tabs}
                    activeTabId={workspace?.tabs?.activeTabId}
                    onSelectTab={workspace?.tabs?.onSelectTab}
                    onCloseTab={workspace?.tabs?.onCloseTab}
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
