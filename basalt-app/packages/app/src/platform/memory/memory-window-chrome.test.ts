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
