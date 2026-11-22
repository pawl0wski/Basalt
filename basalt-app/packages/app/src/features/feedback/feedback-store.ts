import type { AppError } from "@basalt/core";
import { createStore, type StoreApi } from "zustand/vanilla";

export type FeedbackMessage = {
    readonly id: number;
    readonly error: AppError;
};

export type FeedbackState = {
    readonly messages: readonly FeedbackMessage[];
};

export type FeedbackStore = StoreApi<FeedbackState>;

let lastId = 0;

export function createFeedbackStore(): FeedbackStore {
    return createStore<FeedbackState>(() => ({ messages: [] }));
}

export function report(store: FeedbackStore, error: AppError): void {
    lastId += 1;
    const message = { id: lastId, error };
    store.setState((state) => ({
        messages: [...state.messages, message],
    }));
}

export function drain(store: FeedbackStore, upToId: number): void {
    store.setState((state) => ({
        messages: state.messages.filter((message) => message.id > upToId),
    }));
}
