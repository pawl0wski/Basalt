import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { StatusBar } from "@basalt/ui";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { useKeymap } from "../keymap/useKeymap";
import { WelcomeScreenContainer } from "../welcome/WelcomeScreenContainer";
import { AppWindowContainer } from "../window/AppWindowContainer";
import { WorkspaceActivityBarContainer } from "../workspace/WorkspaceActivityBarContainer";
import { WorkspaceMainContainer } from "../workspace/WorkspaceMainContainer";
import { WorkspaceSidebarContainer } from "../workspace/WorkspaceSidebarContainer";
import { StartupScreen } from "./StartupScreen";

export function AppContainer() {
    const { t } = useTranslation();
    const { workspaceStore, workspaceActions, notesActions } = useServices();
    const status = useStore(workspaceStore, (state) => state.status);
    const [restored, setRestored] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const restoring = useRef<Promise<void> | null>(null);

    useEffect(() => {
        restoring.current ??= workspaceActions.restoreWorkspace();
        let active = true;
        void restoring.current.then(() => {
            if (active) setRestored(true);
        });
        return () => {
            active = false;
        };
    }, [workspaceActions]);

    useEffect(() => {
        const onFocus = () => {
            void workspaceActions.refreshOnFocus();
        };
        window.addEventListener("focus", onFocus);
        return () => {
            window.removeEventListener("focus", onFocus);
        };
    }, [workspaceActions]);

    const inWorkspace = restored && status === "open";

    useKeymap({
        open: () => {
            void workspaceActions.openWorkspace();
        },
        ...(inWorkspace && {
            new: () => {
                void notesActions.createNote();
            },
        }),
    });

    if (!restored) {
        return (
            <AppWindowContainer>
                <StartupScreen label={t("welcome.restoring")} />
            </AppWindowContainer>
        );
    }
    if (status === "open") {
        return (
            <AppWindowContainer
                workspace={{
                    sidebarOpen,
                    onToggleSidebar: () => {
                        setSidebarOpen((open) => !open);
                    },
                    activityBar: <WorkspaceActivityBarContainer />,
                    sidebar: <WorkspaceSidebarContainer />,
                    statusBar: <StatusBar />,
                }}
            >
                <WorkspaceMainContainer />
            </AppWindowContainer>
        );
    }
    return (
        <AppWindowContainer>
            <WelcomeScreenContainer />
        </AppWindowContainer>
    );
}
