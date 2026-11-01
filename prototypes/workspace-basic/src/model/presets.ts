import { deriveScreen, openWorkspaceState, reduce } from "./reducer";
import type { Action } from "./reducer";
import type { AppState, ScreenId, Scenario } from "./types";

const WEEKLY = "Weekly plan.md";
const MEETING = "Meeting notes.md";

function withOpenNotes(state: AppState, paths: string[], active: string) {
    const opened = paths.reduce(
        (current, path) => step(current, { type: "open-note", path }),
        state,
    );
    return step(opened, { type: "select-tab", path: active });
}

function step(state: AppState, action: Action) {
    return reduce(state, action, (_, current) => current);
}

function base(state: AppState, patch: Partial<Scenario>): AppState {
    return openWorkspaceState(
        { ...state, scenario: { ...state.scenario, ...patch } },
        "W1",
    );
}

function twoNotes(state: AppState, patch: Partial<Scenario>) {
    return withOpenNotes(base(state, patch), [MEETING, WEEKLY], WEEKLY);
}

function finish(state: AppState, screen: ScreenId): AppState {
    return { ...state, screen };
}

export function applyPreset(screen: ScreenId, state: AppState): AppState {
    const list = {
        nextSave: "ok" as const,
        folder: "present" as const,
    };
    const tree = list;
    switch (screen) {
        case "s01":
            return finish(
                {
                    ...state,
                    workspace: null,
                    tabs: [],
                    active: null,
                    dialog: null,
                    notice: null,
                    status: "",
                    flush: null,
                    hint: null,
                    drag: null,
                    menuFor: null,
                    toast: null,
                    sidebarNotice: null,
                },
                "s01",
            );
        case "s02":
            return finish(base(state, list), "s02");
        case "s03":
            return finish(twoNotes(state, list), "s03");
        case "s04": {
            const open = twoNotes(state, list);
            return finish(
                step(open, { type: "quick-note", folder: "" }),
                "s04",
            );
        }
        case "s05": {
            const open = twoNotes(state, { ...list, nextSave: "denied" });
            const edited = step(open, {
                type: "edit",
                path: WEEKLY,
                text: `${open.tabs.find((t) => t.path === WEEKLY)?.text}\nOne more line.`,
            });
            const saving = step(edited, { type: "save-start", path: WEEKLY });
            const failed = step(saving, { type: "save-finish", path: WEEKLY });
            const closing = step(failed, {
                type: "request-close-tab",
                path: WEEKLY,
            });
            return finish(closing, "s05");
        }
        case "s06": {
            const open = twoNotes(state, list);
            const edited = step(open, {
                type: "edit",
                path: WEEKLY,
                text: `${open.tabs.find((t) => t.path === WEEKLY)?.text}\nOne more line.`,
            });
            return finish(
                {
                    ...edited,
                    tabs: edited.tabs.map((tab) =>
                        tab.path === WEEKLY
                            ? { ...tab, save: "paused", banner: "conflict" }
                            : tab,
                    ),
                    dialog: {
                        kind: "discard-edits",
                        path: WEEKLY,
                        action: "load-from-disk",
                    },
                },
                "s06",
            );
        }
        case "s07": {
            const open = withOpenNotes(
                base(state, list),
                ["demo/Images, all cases.md"],
                "demo/Images, all cases.md",
            );
            return finish(open, "s07");
        }
        case "s08": {
            const open = twoNotes(state, {
                ...list,
                clipboard: "png",
                attach: "ok",
            });
            const lines =
                open.tabs.find((t) => t.path === WEEKLY)?.text.split("\n")
                    .length ?? 1;
            const placed = step(open, {
                type: "set-cursor",
                path: WEEKLY,
                line: lines - 1,
            });
            return finish(step(placed, { type: "paste" }), "s08");
        }
        case "s09":
            return finish(
                {
                    ...twoNotes(state, tree),
                    expanded: ["projects"],
                    hint: "s09",
                },
                "s09",
            );
        case "s10":
            return finish(
                {
                    ...twoNotes(state, tree),
                    expanded: ["projects"],
                    hint: "s10",
                    menuFor: "projects",
                },
                "s10",
            );
        case "s11":
            return finish(
                {
                    ...twoNotes(state, tree),
                    expanded: ["projects"],
                    dialog: {
                        kind: "rename",
                        path: WEEKLY,
                        name: "Weekly plan",
                    },
                },
                "s11",
            );
        case "s12":
            return finish(
                {
                    ...twoNotes(state, tree),
                    expanded: ["projects"],
                    dialog: { kind: "new-folder", parent: "", name: "" },
                },
                "s12",
            );
        case "s13":
            return finish(
                {
                    ...twoNotes(state, tree),
                    expanded: ["projects"],
                    dialog: { kind: "delete", paths: [WEEKLY] },
                },
                "s13",
            );
        case "s14":
            return finish(
                {
                    ...twoNotes(state, tree),
                    expanded: ["projects"],
                    selection: ["Ideas.md", "Reading list.md"],
                    anchor: "Ideas.md",
                    drag: {
                        paths: ["Ideas.md", "Reading list.md"],
                        over: "projects",
                    },
                },
                "s14",
            );
    }
}

export function presetMatches(state: AppState, screen: ScreenId) {
    return deriveScreen(state) === screen || state.screen === screen;
}
