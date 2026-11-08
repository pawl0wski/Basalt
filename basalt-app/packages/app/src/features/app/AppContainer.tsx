import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { useKeymap } from "../keymap/useKeymap";
import { WelcomeScreenContainer } from "../welcome/WelcomeScreenContainer";
import { WorkspacePlaceholderContainer } from "../workspace/WorkspacePlaceholderContainer";
import { StartupScreen } from "./StartupScreen";

export function AppContainer() {
    const { t } = useTranslation();
    const { workspaceStore, workspaceActions } = useServices();
    const status = useStore(workspaceStore, (state) => state.status);
    const [restored, setRestored] = useState(false);
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

    useKeymap({
        open: () => {
            void workspaceActions.openWorkspace();
        },
    });

    if (!restored) return <StartupScreen label={t("welcome.restoring")} />;
    if (status === "open") return <WorkspacePlaceholderContainer />;
    return <WelcomeScreenContainer />;
}
