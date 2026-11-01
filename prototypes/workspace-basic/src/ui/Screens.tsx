import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { SCREEN_NOTES } from "../model/screenNotes";
import { SCREENS } from "../model/screens";
import { useStore } from "../model/store";
import { AppView } from "./AppView";

export function Screens() {
    const { state } = useStore();
    const host = useMemo(() => {
        const element = document.createElement("div");
        element.className = "frame-host";
        return element;
    }, []);

    const lastFocus = useRef<HTMLElement | null>(null);
    const hadDialog = useRef(false);

    useLayoutEffect(() => {
        document.querySelector(`#${state.screen} .frame`)?.appendChild(host);
    }, [state.screen, host]);

    useEffect(() => {
        const remember = (event: FocusEvent) => {
            lastFocus.current = event.target as HTMLElement;
        };
        host.addEventListener("focusin", remember);
        return () => host.removeEventListener("focusin", remember);
    }, [host]);

    useEffect(() => {
        const open = state.dialog !== null;
        const closed = hadDialog.current && !open;
        hadDialog.current = open;
        if (!closed) return;
        const timer = setTimeout(() => {
            const target = lastFocus.current;
            if (
                target?.isConnected &&
                (document.activeElement === document.body ||
                    document.activeElement === null)
            )
                target.focus({ preventScroll: true });
        }, 50);
        return () => clearTimeout(timer);
    }, [state.dialog]);

    return (
        <>
            {SCREENS.map((screen) => (
                <section key={screen.id} className="screen" id={screen.id}>
                    <div className="screen-meta">
                        <h2>
                            {screen.id} {screen.name}
                        </h2>
                        <p>{screen.stories}</p>
                    </div>
                    <div className="frame">
                        <div className="frame-placeholder">
                            Select {screen.id} in the screen map to show it.
                        </div>
                    </div>
                    <div className="notes">
                        <details className="screen-notes">
                            <summary>About this screen</summary>
                            <p className="note">
                                <strong>Stories and states.</strong>{" "}
                                {SCREEN_NOTES[screen.id].stories}
                            </p>
                            <p className="note">
                                <strong>Simulated.</strong>{" "}
                                {SCREEN_NOTES[screen.id].simulated}
                            </p>
                            <p className="note">
                                <strong>Not decided by the prototype.</strong>{" "}
                                {SCREEN_NOTES[screen.id].undecided}
                            </p>
                        </details>
                    </div>
                </section>
            ))}
            {createPortal(<AppView />, host)}
        </>
    );
}
