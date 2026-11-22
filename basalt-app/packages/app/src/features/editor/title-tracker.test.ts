import { describe, expect, it, vi } from "vitest";
import { createTitleTracker, isOnHeading } from "./title-tracker";

const text = "intro\n\n# Title\nbody";
const onHeading = { from: 10, to: 10 };
const inIntro = { from: 2, to: 2 };

describe("isOnHeading", () => {
    it("is true for a cursor or selection touching the heading line", () => {
        expect(isOnHeading(text, onHeading)).toBe(true);
        expect(isOnHeading(text, { from: 0, to: 12 })).toBe(true);
        expect(isOnHeading(text, { from: 7, to: 7 })).toBe(true);
    });

    it("is false elsewhere and when there is no heading", () => {
        expect(isOnHeading(text, inIntro)).toBe(false);
        expect(isOnHeading(text, { from: text.length, to: text.length })).toBe(
            false,
        );
        expect(isOnHeading("no heading", { from: 0, to: 0 })).toBe(false);
    });

    it("ignores an H2 and a heading inside a code block", () => {
        expect(isOnHeading("## Two", { from: 1, to: 1 })).toBe(false);
        expect(isOnHeading("```\n# c\n```", { from: 5, to: 5 })).toBe(false);
    });
});

describe("createTitleTracker", () => {
    it("commits once when the cursor leaves the heading", () => {
        const commit = vi.fn();
        const tracker = createTitleTracker(commit);

        tracker.update(text, onHeading);
        tracker.update(text, { from: 11, to: 11 });
        expect(commit).not.toHaveBeenCalled();

        tracker.update(text, { from: text.length, to: text.length });
        expect(commit).toHaveBeenCalledTimes(1);

        tracker.update(text, inIntro);
        expect(commit).toHaveBeenCalledTimes(1);
    });

    it("does not commit for movement that never touched the heading", () => {
        const commit = vi.fn();
        const tracker = createTitleTracker(commit);

        tracker.update(text, inIntro);
        tracker.update(text, { from: 3, to: 3 });

        expect(commit).not.toHaveBeenCalled();
    });

    it("commits when Enter at the end of the heading moves the cursor to the next line", () => {
        const commit = vi.fn();
        const tracker = createTitleTracker(commit);
        tracker.update("# Title", { from: 7, to: 7 });

        tracker.update("# Title\n", { from: 8, to: 8 });

        expect(commit).toHaveBeenCalledTimes(1);
    });

    it("commits when the heading line is deleted under the cursor", () => {
        const commit = vi.fn();
        const tracker = createTitleTracker(commit);
        tracker.update("# Title\nbody", { from: 3, to: 3 });

        tracker.update("body", { from: 0, to: 0 });

        expect(commit).toHaveBeenCalledTimes(1);
    });

    it("commits on blur only while the cursor is on the heading", () => {
        const commit = vi.fn();
        const tracker = createTitleTracker(commit);

        tracker.blur();
        expect(commit).not.toHaveBeenCalled();

        tracker.update(text, onHeading);
        tracker.blur();
        expect(commit).toHaveBeenCalledTimes(1);
    });
});
