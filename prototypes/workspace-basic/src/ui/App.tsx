import { useEffect, useRef } from "react";
import { StoreProvider } from "../model/store";
import { ReviewBar } from "./ReviewBar";
import { ScenarioBar } from "./ScenarioBar";
import { Screens } from "./Screens";

declare global {
    interface Window {
        __PROTOTYPE_START__?: () => boolean;
    }
}

function useKeepFocusOnNavigation() {
    useEffect(() => {
        const onFocusIn = (event: FocusEvent) => {
            const target = event.target as HTMLElement | null;
            const previous = event.relatedTarget as HTMLElement | null;
            if (!target?.matches?.(".frame h1, .frame h2")) return;
            if (
                !previous ||
                previous === document.body ||
                !previous.isConnected
            )
                return;
            event.stopImmediatePropagation();
            queueMicrotask(() => previous.focus({ preventScroll: true }));
        };
        document.addEventListener("focusin", onFocusIn, true);
        return () => document.removeEventListener("focusin", onFocusIn, true);
    }, []);
}

function Start() {
    useKeepFocusOnNavigation();
    useEffect(() => {
        window.__PROTOTYPE_START__?.();
        const back = document.querySelector(".proto-back");
        const toolbar = document.querySelector(".doc-toolbar");
        if (back && toolbar) toolbar.insertBefore(back, toolbar.children[1]);
    }, []);
    return null;
}

function useBarHeight(ref: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const bar = ref.current;
        if (!bar) return;
        const measure = () =>
            document.documentElement.style.setProperty(
                "--review-bar-height",
                `${bar.offsetHeight}px`,
            );
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(bar);
        return () => observer.disconnect();
    }, [ref]);
}

export function App() {
    const bar = useRef<HTMLDivElement>(null);
    useBarHeight(bar);
    return (
        <StoreProvider>
            <div className="doc">
                <header className="doc-head">
                    <h1>Basalt workspace-basic prototype</h1>
                </header>
                <div className="review-bar" ref={bar}>
                    <ReviewBar />
                    <ScenarioBar />
                </div>
                <Screens />
            </div>
            <Start />
        </StoreProvider>
    );
}
