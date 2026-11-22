import { countWords } from "@basalt/core";
import { useMemo } from "react";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { useServices } from "../../useServices";
import { AppStatusBar } from "./AppStatusBar";

export function AppStatusBarContainer() {
    const { t } = useTranslation();
    const { notesStore } = useServices();
    const active = useStore(notesStore, (state) =>
        state.openNotes.find((note) => note.path === state.activeNote),
    );
    const text = active && !active.openFailed ? active.text : null;
    const wordCount = useMemo(
        () => (text === null ? null : countWords(text)),
        [text],
    );

    return (
        <AppStatusBar
            wordCount={wordCount}
            formatWordCount={(count) =>
                count === 1
                    ? t("statusBar.wordsOne")
                    : t("statusBar.wordsMany", {
                          count: count.toLocaleString("en"),
                      })
            }
        />
    );
}
