import type { ReactNode } from "react";
import { AppShell, TitleBar, type WindowControlLabels } from "@basalt/ui";

export type AppWindowProps = {
    title: string;
    labels: WindowControlLabels;
    maximized: boolean;
    onMinimize: () => void;
    onToggleMaximize: () => void;
    onClose: () => void;
    children: ReactNode;
};

export function AppWindow({
    title,
    labels,
    maximized,
    onMinimize,
    onToggleMaximize,
    onClose,
    children,
}: AppWindowProps) {
    return (
        <AppShell
            titleBar={
                <TitleBar
                    title={title}
                    windowControls={{
                        labels,
                        maximized,
                        onMinimize,
                        onToggleMaximize,
                        onClose,
                    }}
                />
            }
        >
            {children}
        </AppShell>
    );
}
