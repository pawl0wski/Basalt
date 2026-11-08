import { expect, it, vi } from "vitest";
import { createMemoryWindowChrome } from "./memory-window-chrome";

it("ignores window commands and never reports a maximized change", () => {
    const chrome = createMemoryWindowChrome();
    const listener = vi.fn();

    expect(() => {
        chrome.minimize();
        chrome.toggleMaximize();
        chrome.close();
        chrome.subscribeMaximized(listener)();
    }).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
});

it("runs close handlers when close is requested and stops after unsubscribe", async () => {
    const chrome = createMemoryWindowChrome();
    const handler = vi.fn(() => Promise.resolve(true));
    const stop = chrome.onCloseRequested(handler);

    chrome.close();
    stop();
    chrome.close();
    await Promise.resolve();

    expect(handler).toHaveBeenCalledOnce();
    expect(() => chrome.destroy()).not.toThrow();
});
