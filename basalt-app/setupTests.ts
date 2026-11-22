import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

if (typeof Range !== "undefined") {
    const emptyRects = () =>
        Object.assign([], { item: () => null }) as unknown as DOMRectList;
    Range.prototype.getClientRects ??= emptyRects;
    Range.prototype.getBoundingClientRect ??= () => new DOMRect();
}

afterEach(() => {
    cleanup();
});
