import { useTranslation } from "react-i18next";
import { WorkspaceActivityBar } from "./WorkspaceActivityBar";

export function WorkspaceActivityBarContainer() {
    const { t } = useTranslation();

    return <WorkspaceActivityBar notesLabel={t("workspace.sections.notes")} />;
}
