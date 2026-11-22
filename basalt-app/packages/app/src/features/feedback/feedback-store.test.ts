import type { AppError } from "@basalt/core";
import { describe, expect, it } from "vitest";
import { createFeedbackStore, drain, report } from "./feedback-store";

const first: AppError = { code: "already-exists", message: "a" };
const second: AppError = { code: "not-found", message: "b" };

describe("feedback store", () => {
    it("appends messages with increasing ids", () => {
        const store = createFeedbackStore();
        report(store, first);
        report(store, second);

        const { messages } = store.getState();
        expect(messages.map((message) => message.error)).toEqual([
            first,
            second,
        ]);
        expect(messages[1].id).toBeGreaterThan(messages[0].id);
    });

    it("drains up to an id and keeps newer messages", () => {
        const store = createFeedbackStore();
        report(store, first);
        report(store, second);
        const [one] = store.getState().messages;

        drain(store, one.id);

        expect(
            store.getState().messages.map((message) => message.error),
        ).toEqual([second]);
    });

    it("never reuses an id after a drain and is idempotent", () => {
        const store = createFeedbackStore();
        report(store, first);
        const [one] = store.getState().messages;
        drain(store, one.id);
        drain(store, one.id);
        report(store, second);

        const [next] = store.getState().messages;
        expect(next.id).toBeGreaterThan(one.id);
        expect(store.getState().messages).toHaveLength(1);
    });

    it("keeps separate stores independent", () => {
        const a = createFeedbackStore();
        const b = createFeedbackStore();
        report(a, first);

        expect(b.getState().messages).toEqual([]);
    });
});
