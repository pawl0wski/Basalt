import { useEffect, useRef } from "react";
import { createShortcutHandler, type ShortcutHandlers } from "./keymap";

export function useKeymap(handlers: ShortcutHandlers): void {
    const latest = useRef(handlers);

    useEffect(() => {
        latest.current = handlers;
    });

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            createShortcutHandler(latest.current)(event);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, []);
}
