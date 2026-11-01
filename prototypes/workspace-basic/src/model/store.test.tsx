import { describe, expect, it } from "vitest";
import { applyPreset } from "./presets";
import { bootState, defaultScenario, reduce } from "./reducer";
import type { Action } from "./reducer";
import { desiredTimers } from "./store";

const run = (...actions: Action[]) =>
    actions.reduce(
        (state, action) => reduce(state, action, applyPreset),
        bootState({ ...defaultScenario, attach: "slow" }),
    );

const keys = (state: ReturnType<typeof run>) =>
    desiredTimers(state).map((timer) => timer.key);

describe("desiredTimers", () => {
    it("keeps the slow-write timer when an autosave timer changes", () => {
        const adding = run(
            { type: "pick-workspace" },
            { type: "open-note", path: "Ideas.md" },
            { type: "edit", path: "Ideas.md", text: "# Ideas\nmore" },
            { type: "paste" },
        );
        expect(keys(adding)).toContain("add-complete");
        const saving = reduce(
            adding,
            { type: "save-start", path: "Ideas.md" },
            applyPreset,
        );
        expect(keys(saving)).toContain("add-complete");
        expect(keys(saving)).not.toEqual(keys(adding));
    });

    it("restarts the autosave debounce for every new keystroke", () => {
        const base = run(
            { type: "pick-workspace" },
            { type: "open-note", path: "Ideas.md" },
            { type: "edit", path: "Ideas.md", text: "a" },
        );
        const typed = reduce(
            base,
            { type: "edit", path: "Ideas.md", text: "ab" },
            applyPreset,
        );
        expect(keys(typed)).not.toEqual(keys(base));
    });

    it("schedules nothing for a settled workspace", () => {
        const settled = run(
            { type: "pick-workspace" },
            { type: "open-note", path: "Ideas.md" },
        );
        expect(desiredTimers(settled)).toEqual([]);
    });
});
