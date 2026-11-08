import { describe, expect, it } from "vitest";
import {
    defaultAppSettings,
    parseAppSettings,
    parseAppSettingsText,
    type AppSettings,
} from "./index";

const ROOT = "/home/me/notes";

function valid(extra: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        version: 1,
        lastWorkspace: ROOT,
        workspaces: {
            [ROOT]: { openNotes: ["a.md", "dir/b.md"], activeNote: "dir/b.md" },
        },
        ...extra,
    };
}

function workspace(settings: AppSettings) {
    return settings.workspaces[ROOT];
}

describe("defaultAppSettings", () => {
    it("means no last workspace and returns a fresh object each time", () => {
        expect(defaultAppSettings()).toEqual({
            version: 1,
            lastWorkspace: null,
            workspaces: {},
        });
        expect(defaultAppSettings()).not.toBe(defaultAppSettings());
    });
});

describe("parseAppSettings", () => {
    it("accepts valid settings unchanged", () => {
        expect(parseAppSettings(valid())).toEqual(valid());
    });

    it("accepts a null last workspace and no workspaces", () => {
        expect(
            parseAppSettings({
                version: 1,
                lastWorkspace: null,
                workspaces: {},
            }),
        ).toEqual(defaultAppSettings());
    });

    it("fills in missing optional parts", () => {
        expect(parseAppSettings({ version: 1 })).toEqual(defaultAppSettings());
        expect(parseAppSettings({ version: 1, lastWorkspace: ROOT })).toEqual({
            version: 1,
            lastWorkspace: ROOT,
            workspaces: {},
        });
    });

    it.each([null, undefined, [], [valid()], 1, "text", true, {}])(
        "returns defaults for garbage %j without throwing",
        (garbage) => {
            expect(parseAppSettings(garbage)).toEqual(defaultAppSettings());
        },
    );

    it.each([2, 99, 0, "1", null, undefined])(
        "returns defaults for unsupported version %j",
        (version) => {
            expect(parseAppSettings(valid({ version }))).toEqual(
                defaultAppSettings(),
            );
        },
    );

    it("treats future-version input as defaults, not partially valid data", () => {
        const parsed = parseAppSettings(
            valid({ version: 2, extra: { anything: true } }),
        );
        expect(parsed.lastWorkspace).toBeNull();
        expect(parsed.workspaces).toEqual({});
        expect(parsed.version).toBe(1);
    });

    it.each([42, "", {}, [], true])(
        "drops a last workspace of wrong type %j",
        (lastWorkspace) => {
            expect(
                parseAppSettings(valid({ lastWorkspace })).lastWorkspace,
            ).toBe(null);
        },
    );

    it.each([null, [], "x", 3])(
        "ignores workspaces of wrong type %j but keeps lastWorkspace",
        (workspaces) => {
            expect(parseAppSettings(valid({ workspaces }))).toEqual({
                version: 1,
                lastWorkspace: ROOT,
                workspaces: {},
            });
        },
    );

    it("drops invalid entries under workspaces and keeps valid ones", () => {
        const parsed = parseAppSettings(
            valid({
                workspaces: {
                    [ROOT]: { openNotes: ["a.md"], activeNote: null },
                    "/bad/null": null,
                    "/bad/array": [],
                    "/bad/string": "x",
                    "": { openNotes: [], activeNote: null },
                },
            }),
        );
        expect(Object.keys(parsed.workspaces)).toEqual([ROOT]);
    });

    it("drops invalid and non-string entries in openNotes and keeps the rest", () => {
        const parsed = parseAppSettings(
            valid({
                workspaces: {
                    [ROOT]: {
                        openNotes: [
                            "a.md",
                            "../escape.md",
                            "/abs.md",
                            "back\\slash.md",
                            "",
                            7,
                            null,
                            { path: "x.md" },
                            "b.md",
                        ],
                        activeNote: "b.md",
                    },
                },
            }),
        );
        expect(workspace(parsed)).toEqual({
            openNotes: ["a.md", "b.md"],
            activeNote: "b.md",
        });
    });

    it("treats missing or non-array openNotes as empty and clears activeNote", () => {
        const missing = parseAppSettings(
            valid({ workspaces: { [ROOT]: { activeNote: "a.md" } } }),
        );
        expect(workspace(missing)).toEqual({ openNotes: [], activeNote: null });
        const wrong = parseAppSettings(
            valid({
                workspaces: {
                    [ROOT]: { openNotes: "a.md", activeNote: "a.md" },
                },
            }),
        );
        expect(workspace(wrong)).toEqual({ openNotes: [], activeNote: null });
    });

    it("drops an activeNote that is not open", () => {
        const parsed = parseAppSettings(
            valid({
                workspaces: {
                    [ROOT]: { openNotes: ["a.md"], activeNote: "other.md" },
                },
            }),
        );
        expect(workspace(parsed)).toEqual({
            openNotes: ["a.md"],
            activeNote: null,
        });
    });

    it.each([5, {}, [], undefined, "../x.md"])(
        "drops an activeNote of invalid value %j",
        (activeNote) => {
            const parsed = parseAppSettings(
                valid({
                    workspaces: { [ROOT]: { openNotes: ["a.md"], activeNote } },
                }),
            );
            expect(workspace(parsed)?.activeNote).toBeNull();
        },
    );

    it("removes duplicate open notes, including case-only duplicates, keeping the first", () => {
        const parsed = parseAppSettings(
            valid({
                workspaces: {
                    [ROOT]: {
                        openNotes: ["a.md", "b.md", "a.md", "A.md"],
                        activeNote: "A.md",
                    },
                },
            }),
        );
        expect(workspace(parsed)).toEqual({
            openNotes: ["a.md", "b.md"],
            activeNote: "a.md",
        });
    });

    it("does not mutate its input", () => {
        const input = valid();
        const copy = structuredClone(input);
        parseAppSettings(input);
        expect(input).toEqual(copy);
    });
});

describe("parseAppSettingsText", () => {
    it("parses valid JSON text", () => {
        expect(parseAppSettingsText(JSON.stringify(valid()))).toEqual(valid());
    });

    it.each(["", "{", "not json", '{"version": 1,', "\u0000"])(
        "returns defaults for malformed JSON %j",
        (text) => {
            expect(parseAppSettingsText(text)).toEqual(defaultAppSettings());
        },
    );

    it.each(["null", "[]", "42", '"text"', "true"])(
        "returns defaults for JSON garbage %s",
        (text) => {
            expect(parseAppSettingsText(text)).toEqual(defaultAppSettings());
        },
    );

    it("returns defaults for future-version text", () => {
        expect(
            parseAppSettingsText(JSON.stringify(valid({ version: 3 }))),
        ).toEqual(defaultAppSettings());
    });
});
