import { useToast } from "@basalt/ui";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { useServices } from "../../useServices";
import { describeOperationError } from "./describe-error";
import { toastKind } from "./error-surface";
import { TOAST_DURATION_MS } from "./feedback";
import { drain } from "./feedback-store";

export function FeedbackBridge(): null {
    const { t } = useTranslation();
    const toast = useToast();
    const { feedbackStore } = useServices();
    const messages = useStore(feedbackStore, (state) => state.messages);

    useEffect(() => {
        const pending = feedbackStore.getState().messages;
        const last = pending[pending.length - 1];
        if (!last) return;
        drain(feedbackStore, last.id);
        for (const message of pending) {
            toast({
                kind: toastKind(message.error),
                title: describeOperationError(t, message.error),
                duration: TOAST_DURATION_MS,
            });
        }
    }, [messages, feedbackStore, toast, t]);

    return null;
}
