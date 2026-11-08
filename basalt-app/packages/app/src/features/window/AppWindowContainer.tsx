import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { AppWindow, type AppWindowWorkspace } from "./AppWindow";

export function AppWindowContainer({
    workspace,
    children,
}: {
    workspace?: AppWindowWorkspace;
    children: ReactNode;
}) {
    const { t } = useTranslation();
    const { windowChrome } = useServices();
    const [maximized, setMaximized] = useState(false);

    useEffect(
        () => windowChrome.subscribeMaximized(setMaximized),
        [windowChrome],
    );

    return (
        <AppWindow
            title={t("window.title")}
            labels={{
                minimize: t("window.minimize"),
                maximize: t("window.maximize"),
                restore: t("window.restore"),
                close: t("window.close"),
            }}
            maximized={maximized}
            workspace={workspace}
            onMinimize={() => windowChrome.minimize()}
            onToggleMaximize={() => windowChrome.toggleMaximize()}
            onClose={() => windowChrome.close()}
        >
            {children}
        </AppWindow>
    );
}
