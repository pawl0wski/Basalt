export type ShortcutId = "open" | "save" | "new";

export type ShortcutEvent = {
    readonly key: string;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    readonly repeat?: boolean;
    readonly isComposing?: boolean;
    preventDefault(): void;
};

export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

const shortcutKeys: Readonly<Record<string, ShortcutId>> = {
    o: "open",
    s: "save",
    n: "new",
};

export function resolveShortcut(
    event: Omit<ShortcutEvent, "preventDefault">,
): ShortcutId | null {
    if (event.isComposing) return null;
    if (event.ctrlKey === event.metaKey) return null;
    if (event.shiftKey || event.altKey) return null;
    return shortcutKeys[event.key.toLowerCase()] ?? null;
}

export function createShortcutHandler(
    handlers: ShortcutHandlers,
): (event: ShortcutEvent) => void {
    return (event) => {
        const id = resolveShortcut(event);
        if (id === null) return;
        const handler = handlers[id];
        if (!handler) return;
        event.preventDefault();
        if (event.repeat) return;
        handler();
    };
}
