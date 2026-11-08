import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { AppStatusBar } from "./AppStatusBar";
import { toSaveState } from "./save-state";

export function AppStatusBarContainer() {
    const { t } = useTranslation();
    const { notesStore } = useServices();
    const active = useStore(notesStore, (state) =>
        state.openNotes.find((note) => note.path === state.activeNote),
    );

    return (
        <AppStatusBar
            saveState={
                active && !active.openFailed
                    ? toSaveState(active.saveStatus)
                    : null
            }
            labels={{
                saved: t("saveStatus.saved"),
                saving: t("saveStatus.saving"),
                unsaved: t("saveStatus.notSaved"),
            }}
        />
    );
}
