import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
} from "react";
import type { Dispatch, ReactNode } from "react";
import { applyPreset } from "./presets";
import {
    PENDING_MS,
    SAVE_DEBOUNCE_MS,
    SAVING_MS,
    SLOW_MS,
    bootState,
    defaultScenario,
    deriveScreen,
    reduce,
} from "./reducer";
import type { Action } from "./reducer";
import type { AppState, ScreenId } from "./types";

type Store = { state: AppState; dispatch: Dispatch<Action> };

const StoreContext = createContext<Store | null>(null);

function reducer(state: AppState, action: Action): AppState {
    return reduce(state, action, applyPreset);
}

export function useStore() {
    const store = useContext(StoreContext);
    if (!store) throw new Error("useStore must be used inside StoreProvider");
    return store;
}

type Timer = { key: string; action: Action; ms: number };

export function desiredTimers(state: AppState): Timer[] {
    const timers: Timer[] = [];
    for (const tab of state.tabs) {
        if (tab.save === "pending")
            timers.push({
                key: `save-start:${tab.path}:${tab.rev}`,
                action: { type: "save-start", path: tab.path },
                ms: SAVE_DEBOUNCE_MS,
            });
        if (tab.save === "saving")
            timers.push({
                key: `save-finish:${tab.path}:${tab.rev}`,
                action: { type: "save-finish", path: tab.path },
                ms: SAVING_MS,
            });
        if (tab.loading)
            timers.push({
                key: `note-loaded:${tab.path}`,
                action: { type: "note-loaded", path: tab.path },
                ms: SLOW_MS,
            });
    }
    if (state.dialog && "pending" in state.dialog && state.dialog.pending)
        timers.push({
            key: "complete-submit",
            action: { type: "complete-submit" },
            ms: PENDING_MS,
        });
    if (state.listStatus === "loading")
        timers.push({
            key: "list-loaded",
            action: { type: "list-loaded" },
            ms: SLOW_MS,
        });
    if (state.restoring)
        timers.push({
            key: "restore-done",
            action: { type: "restore-done" },
            ms: SLOW_MS,
        });
    if (state.adding)
        timers.push({
            key: "add-complete",
            action: { type: "add-complete" },
            ms: SLOW_MS,
        });
    return timers;
}

export function useTimers(state: AppState, dispatch: Dispatch<Action>) {
    const running = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    useEffect(() => {
        const wanted = desiredTimers(state);
        const keys = new Set(wanted.map((timer) => timer.key));
        for (const [key, handle] of running.current) {
            if (!keys.has(key)) {
                clearTimeout(handle);
                running.current.delete(key);
            }
        }
        for (const timer of wanted) {
            if (running.current.has(timer.key)) continue;
            running.current.set(
                timer.key,
                setTimeout(() => {
                    running.current.delete(timer.key);
                    dispatch(timer.action);
                }, timer.ms),
            );
        }
    });
    useEffect(
        () => () => {
            running.current.forEach(clearTimeout);
            running.current.clear();
        },
        [],
    );
}

function useEngineSync(state: AppState, dispatch: Dispatch<Action>) {
    const latest = useRef(state);
    latest.current = state;

    useLayoutEffect(() => {
        const onScreenChange = (event: Event) => {
            const screen = (event as CustomEvent<string>).detail as ScreenId;
            if (latest.current.screen !== screen)
                dispatch({ type: "enter-screen", screen });
        };
        document.addEventListener("prototype:screen-change", onScreenChange);
        return () =>
            document.removeEventListener(
                "prototype:screen-change",
                onScreenChange,
            );
    }, [dispatch]);

    const announced = useRef(state.screen);
    useEffect(() => {
        if (announced.current === state.screen) return;
        announced.current = state.screen;
        document.dispatchEvent(
            new CustomEvent("prototype:navigate", { detail: state.screen }),
        );
    }, [state.screen]);
}

export function StoreProvider({
    children,
    initial,
}: {
    children: ReactNode;
    initial?: AppState;
}) {
    const [state, dispatch] = useReducer(
        reducer,
        initial ?? bootState(defaultScenario),
    );
    useTimers(state, dispatch);
    useEngineSync(state, dispatch);
    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
    return (
        <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
    );
}

export { deriveScreen };
