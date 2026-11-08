import { useTranslation } from "react-i18next";
import { WorkspaceMain } from "./WorkspaceMain";

export function WorkspaceMainContainer() {
    const { t } = useTranslation();

    return (
        <WorkspaceMain
            title={t("workspace.noNote.title")}
            description={t("workspace.noNote.description")}
        />
    );
}
