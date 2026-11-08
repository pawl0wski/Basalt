import { describe, expect, it, vi } from "vitest";
import type { PhysicalSize } from "@tauri-apps/api/dpi";
import type { Event } from "@tauri-apps/api/event";
import { createTauriWindowChrome } from "./tauri-window-chrome";

function fakeWindow(initial = false) {
    const state = { maximized: initial };
    const handlers: Array<(event: Event<PhysicalSize>) => void> = [];
    const unlisten = vi.fn();
    const target = {
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
});
