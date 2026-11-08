import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { WelcomeScreen, type WelcomePrinciple } from "./WelcomeScreen";

const principleIds: readonly WelcomePrinciple["id"][] = [
    "markdown",
    "workspace",
    "private",
];

export function WelcomeScreenContainer() {
    const { t } = useTranslation();
    const { workspaceStore, workspaceActions } = useServices();
    const { status, error, notice } = useStore(workspaceStore);

    return (
        <WelcomeScreen
            texts={{
                headline: t("welcome.headline"),
                intro: t("welcome.intro"),
                openFolder: t("welcome.openFolder"),
                folderHint: t("welcome.folderHint"),
            }}
            principles={principleIds.map((id) => ({
                id,
                title: t(`welcome.principles.${id}.title`),
                description: t(`welcome.principles.${id}.description`),
            }))}
            notice={
                notice
                    ? {
                          title: t(`welcome.notices.${notice}.title`),
                          message: t(`welcome.notices.${notice}.message`),
                      }
                    : null
            }
            error={
                error
                    ? {
                          title: t("welcome.openError.title"),
                          message: t(`errors.${error.code}`),
                      }
                    : null
            }
            busy={status === "opening"}
            onOpenFolder={() => {
                void workspaceActions.openWorkspace();
            }}
        />
    );
}
