import { describe, expect, it } from "vitest";
import { toSaveState } from "./save-state";

describe("toSaveState", () => {
    it.each([
        ["saved", "saved"],
        ["saving", "saving"],
        ["pending", "unsaved"],
        ["paused", "unsaved"],
    ] as const)("maps %s to %s", (status, expected) => {
        expect(toSaveState(status)).toBe(expected);
    });
});
