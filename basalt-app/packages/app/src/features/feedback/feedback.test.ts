import type { AppError } from "@basalt/core";
import { describe, expect, it, vi } from "vitest";
import { createFeedback } from "./feedback";
import { createFeedbackStore } from "./feedback-store";

describe("createFeedback", () => {
    it("queues a toast error and does not set a persistent one", () => {
        const store = createFeedbackStore();
        const setPersistent = vi.fn();
        const error: AppError = { code: "already-exists", message: "x" };

        createFeedback({ store, setPersistent }).report(error);

        expect(store.getState().messages.map((m) => m.error)).toEqual([error]);
        expect(setPersistent).not.toHaveBeenCalled();
    });

    it("sets a persistent error and queues no toast", () => {
        const store = createFeedbackStore();
        const setPersistent = vi.fn();
        const error: AppError = { code: "permission-denied", message: "x" };

        createFeedback({ store, setPersistent }).report(error);

        expect(setPersistent).toHaveBeenCalledWith(error);
        expect(store.getState().messages).toEqual([]);
    });
});
