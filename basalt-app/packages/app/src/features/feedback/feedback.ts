import type { AppError } from "@basalt/core";
import { errorSurface } from "./error-surface";
import { report, type FeedbackStore } from "./feedback-store";

export const TOAST_DURATION_MS = 5000;

export type Feedback = { report(error: AppError): void };

export function createFeedback(options: {
    readonly store: FeedbackStore;
    readonly setPersistent: (error: AppError) => void;
}): Feedback {
    return {
        report(error) {
            if (errorSurface(error) === "toast") report(options.store, error);
            else options.setPersistent(error);
        },
    };
}
