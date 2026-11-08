import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { folderName } from "./folder-name";
import { WorkspacePlaceholder } from "./WorkspacePlaceholder";

export function WorkspacePlaceholderContainer() {
    const { t } = useTranslation();
    const { workspaceStore } = useServices();
    const root = useStore(workspaceStore, (state) => state.root);

    return (
        <WorkspacePlaceholder
            title={t("workspace.openTitle")}
            folderName={root === null ? "" : folderName(root)}
        />
    );
}
