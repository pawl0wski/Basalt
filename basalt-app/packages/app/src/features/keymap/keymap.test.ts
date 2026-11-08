import { describe, expect, it, vi } from "vitest";
import {
    createShortcutHandler,
    resolveShortcut,
    type ShortcutEvent,
} from "./keymap";

function event(overrides: Partial<ShortcutEvent> = {}): ShortcutEvent {
    return {
        key: "o",
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
        ...overrides,
    };
}

describe("resolveShortcut", () => {
    it.each([
        ["o", "open"],
        ["s", "save"],
        ["n", "new"],
        ["O", "open"],
    ] as const)("maps Ctrl+%s to %s", (key, id) => {
        expect(resolveShortcut(event({ key }))).toBe(id);
    });

    it("accepts Cmd as the modifier", () => {
        expect(resolveShortcut(event({ ctrlKey: false, metaKey: true }))).toBe(
            "open",
        );
    });

    it.each([
        ["no modifier", { ctrlKey: false }],
        ["both Ctrl and Cmd", { metaKey: true }],
        ["Shift", { shiftKey: true }],
        ["Alt", { altKey: true }],
        ["composition", { isComposing: true }],
        ["another key", { key: "p" }],
    ])("ignores %s", (_name, overrides) => {
        expect(resolveShortcut(event(overrides))).toBeNull();
    });
});

describe("createShortcutHandler", () => {
    it("runs the handler and prevents the default for a handled shortcut", () => {
        const open = vi.fn();
        const e = event();

        createShortcutHandler({ open })(e);

        expect(open).toHaveBeenCalledTimes(1);
        expect(e.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("leaves a recognised shortcut without a handler to the browser", () => {
        const e = event({ key: "s" });

        createShortcutHandler({ open: vi.fn() })(e);

        expect(e.preventDefault).not.toHaveBeenCalled();
    });

    it("does not call handlers or prevent the default for other combinations", () => {
        const open = vi.fn();
        const handle = createShortcutHandler({ open });
        const others = [
            event({ ctrlKey: false }),
            event({ shiftKey: true }),
            event({ key: "x" }),
        ];

        for (const e of others) handle(e);

        expect(open).not.toHaveBeenCalled();
        for (const e of others) expect(e.preventDefault).not.toHaveBeenCalled();
    });

    it("swallows auto-repeat without running the handler again", () => {
        const open = vi.fn();
        const e = event({ repeat: true });

        createShortcutHandler({ open })(e);

        expect(open).not.toHaveBeenCalled();
        expect(e.preventDefault).toHaveBeenCalledTimes(1);
    });
});
