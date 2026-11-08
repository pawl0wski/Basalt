import { useTranslation } from "react-i18next";
import { WelcomeScreen, type WelcomePrinciple } from "./WelcomeScreen";

const principleIds: readonly WelcomePrinciple["id"][] = [
    "markdown",
    "workspace",
    "private",
];

function openFolder() {}

export function WelcomeScreenContainer() {
    const { t } = useTranslation();

    return (
        <WelcomeScreen
            texts={{
                brand: t("welcome.brand"),
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
            onOpenFolder={openFolder}
        />
    );
}
