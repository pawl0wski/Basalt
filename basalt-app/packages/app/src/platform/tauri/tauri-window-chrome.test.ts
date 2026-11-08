import { describe, expect, it, vi } from "vitest";
import type { PhysicalSize } from "@tauri-apps/api/dpi";
import type { Event } from "@tauri-apps/api/event";
import { createTauriWindowChrome } from "./tauri-window-chrome";

function fakeWindow(initial = false) {
    const state = { maximized: initial };
    const handlers: Array<(event: Event<PhysicalSize>) => void> = [];
    const unlisten = vi.fn();
    const closeHandlers: Array<
        (event: { preventDefault(): void }) => Promise<void>
    > = [];
    const closeUnlisten = vi.fn();
    const target = {
        destroy: vi.fn(() => Promise.resolve()),
        onCloseRequested: vi.fn(
            (handler: (event: { preventDefault(): void }) => Promise<void>) => {
                closeHandlers.push(handler);
                return Promise.resolve(closeUnlisten);
            },
        ),
        minimize: vi.fn(() => Promise.resolve()),
        toggleMaximize: vi.fn(() => Promise.resolve()),
        close: vi.fn(() => Promise.resolve()),
        isMaximized: vi.fn(() => Promise.resolve(state.maximized)),
        onResized: vi.fn((handler: (event: Event<PhysicalSize>) => void) => {
            handlers.push(handler);
            return Promise.resolve(unlisten);
        }),
    };
    return {
        target,
        unlisten,
        closeUnlisten,
        async requestClose() {
            const event = { preventDefault: vi.fn() };
            for (const handler of closeHandlers) await handler(event);
            return event;
        },
        resize(maximized: boolean) {
            state.maximized = maximized;
            for (const handler of handlers) handler({} as Event<PhysicalSize>);
        },
    };
}

async function flush() {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("createTauriWindowChrome", () => {
    it("forwards minimize, toggleMaximize and close to the current window", () => {
        const win = fakeWindow();
        const chrome = createTauriWindowChrome(() => win.target);

        chrome.minimize();
        chrome.toggleMaximize();
        chrome.close();

        expect(win.target.minimize).toHaveBeenCalledOnce();
        expect(win.target.toggleMaximize).toHaveBeenCalledOnce();
        expect(win.target.close).toHaveBeenCalledOnce();
    });

    it("does not throw or leak an unhandled rejection when a window call fails", async () => {
        const win = fakeWindow();
        win.target.close.mockRejectedValue(new Error("not allowed"));
        const chrome = createTauriWindowChrome(() => win.target);
        const unhandled = vi.fn();
        process.on("unhandledRejection", unhandled);

        expect(() => chrome.close()).not.toThrow();
        await flush();
        process.off("unhandledRejection", unhandled);

        expect(unhandled).not.toHaveBeenCalled();
    });

    it("reports the initial state and later changes only when they differ", async () => {
        const win = fakeWindow(true);
        const listener = vi.fn();

        createTauriWindowChrome(() => win.target).subscribeMaximized(listener);
        await flush();
        expect(listener.mock.calls).toEqual([[true]]);

        win.resize(true);
        await flush();
        win.resize(false);
        await flush();

        expect(listener.mock.calls).toEqual([[true], [false]]);
    });

    it("stops reporting and unlistens after unsubscribe, even if the subscription was not ready yet", async () => {
        const win = fakeWindow();
        const listener = vi.fn();

        const unsubscribe = createTauriWindowChrome(
            () => win.target,
        ).subscribeMaximized(listener);
        unsubscribe();
        await flush();
        win.resize(true);
        await flush();

        expect(listener).not.toHaveBeenCalled();
        expect(win.unlisten).toHaveBeenCalledOnce();
    });

    it("destroys the window", () => {
        const win = fakeWindow();

        createTauriWindowChrome(() => win.target).destroy();

        expect(win.target.destroy).toHaveBeenCalledOnce();
    });

    it("lets the window close when the close handler allows it", async () => {
        const win = fakeWindow();
        createTauriWindowChrome(() => win.target).onCloseRequested(() =>
            Promise.resolve(true),
        );

        const event = await win.requestClose();

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("prevents the close when the handler refuses or fails", async () => {
        const refusing = fakeWindow();
        createTauriWindowChrome(() => refusing.target).onCloseRequested(() =>
            Promise.resolve(false),
        );
        const failing = fakeWindow();
        createTauriWindowChrome(() => failing.target).onCloseRequested(() =>
            Promise.reject(new Error("boom")),
        );

        const first = await refusing.requestClose();
        const second = await failing.requestClose();

        expect(first.preventDefault).toHaveBeenCalledOnce();
        expect(second.preventDefault).toHaveBeenCalledOnce();
    });

    it("stops listening for close requests after unsubscribe", async () => {
        const win = fakeWindow();
        const stop = createTauriWindowChrome(() => win.target).onCloseRequested(
            () => Promise.resolve(true),
        );

        stop();
        await flush();

        expect(win.closeUnlisten).toHaveBeenCalledOnce();
    });
});
