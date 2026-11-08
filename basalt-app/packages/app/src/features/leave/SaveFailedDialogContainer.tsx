import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { failedNoteName } from "./failed-note-name";
import { SaveFailedDialog } from "./SaveFailedDialog";

export function SaveFailedDialogContainer() {
    const { t } = useTranslation();
    const { leaveStore, leaveActions, notesStore } = useServices();
    const pending = useStore(leaveStore, (state) => state.pending);
    const error = useStore(leaveStore, (state) => state.error);
    const openNotes = useStore(notesStore, (state) => state.openNotes);

    return (
        <SaveFailedDialog
            open={pending !== null}
            title={t("saveFailed.title", {
                name: pending ? failedNoteName(pending, openNotes) : "",
            })}
            reason={error ? t(`errors.${error.code}`) : ""}
            labels={{
                retry: t("saveFailed.retry"),
                discard: t("saveFailed.discard"),
                cancel: t("saveFailed.cancel"),
            }}
            onRetry={() => {
                void leaveActions.retry();
            }}
            onDiscard={() => {
                void leaveActions.discard();
            }}
            onCancel={() => {
                leaveActions.cancel();
            }}
        />
    );
}
