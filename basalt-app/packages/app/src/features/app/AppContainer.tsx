import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { ToastProvider } from "@basalt/ui";
import { installDropGuard } from "../attachments/drop-guard";
import { FeedbackBridge } from "../feedback/FeedbackBridge";
import { useServices } from "../../useServices";
import { useNoteTabs } from "../editor/useNoteTabs";
import { useKeymap } from "../keymap/useKeymap";
import { SaveFailedDialogContainer } from "../leave/SaveFailedDialogContainer";
import { AppStatusBarContainer } from "../status/AppStatusBarContainer";
import { WelcomeScreenContainer } from "../welcome/WelcomeScreenContainer";
import { AppWindowContainer } from "../window/AppWindowContainer";
import { WorkspaceActivityBarContainer } from "../workspace/WorkspaceActivityBarContainer";
import { WorkspaceMainContainer } from "../workspace/WorkspaceMainContainer";
import { WorkspaceSidebarContainer } from "../workspace/WorkspaceSidebarContainer";
import { StartupScreen } from "./StartupScreen";

function AppContent() {
    const { t } = useTranslation();
    const {
        workspaceStore,
        workspaceActions,
        notesStore,
        notesActions,
        leaveActions,
        windowChrome,
    } = useServices();
    const status = useStore(workspaceStore, (state) => state.status);
    const [restored, setRestored] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const tabs = useNoteTabs();
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

    useEffect(() => installDropGuard(window), []);

    useEffect(
        () =>
            windowChrome.onCloseRequested(() =>
                leaveActions.handleCloseRequest(),
            ),
        [windowChrome, leaveActions],
    );

    const inWorkspace = restored && status === "open";

    useKeymap({
        open: () => {
            void workspaceActions.openWorkspace();
        },
        ...(inWorkspace && {
            save: () => {
                const active = notesStore.getState().activeNote;
                if (active) void notesActions.saveNow(active);
            },
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
                    tabs,
                    sidebarOpen,
                    onToggleSidebar: () => {
                        setSidebarOpen((open) => !open);
                    },
                    onNewNote: () => {
                        void notesActions.createNote();
                    },
                    activityBar: <WorkspaceActivityBarContainer />,
                    sidebar: <WorkspaceSidebarContainer />,
                    statusBar: <AppStatusBarContainer />,
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

export function AppContainer() {
    const { t } = useTranslation();
    return (
        <ToastProvider
            label={t("toasts.regionLabel")}
            dismissLabel={t("toasts.dismissLabel")}
        >
            <AppContent />
            <SaveFailedDialogContainer />
            <FeedbackBridge />
        </ToastProvider>
    );
}
