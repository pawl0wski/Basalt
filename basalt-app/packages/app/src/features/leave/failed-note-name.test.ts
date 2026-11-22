import { describe, expect, it } from "vitest";
import type { NoteSession } from "../notes/notes-store";
import { wsPath } from "../test-harness";
import { failedNoteName } from "./failed-note-name";

function session(path: string, text: string, error = false): NoteSession {
    return {
        id: 1,
        path: wsPath(path),
        text,
        baseText: "x",
        eol: "lf",
        bom: false,
        error: error ? { code: "unknown", message: "" } : null,
        openFailed: false,
        saveStatus: "paused",
        titleError: null,
        titlePending: false,
    };
}

describe("failedNoteName", () => {
    it("names the note of a close-tab leave", () => {
        expect(
            failedNoteName(
                { kind: "close-tab", path: wsPath("dir/Plan.md") },
                [],
            ),
        ).toBe("Plan");
    });

    it("names the dirty note that has the save error first", () => {
        const notes = [session("a.md", "y"), session("b.md", "y", true)];

        expect(failedNoteName({ kind: "close-window" }, notes)).toBe("b");
    });

    it("falls back to any dirty note and then to an empty name", () => {
        expect(
            failedNoteName({ kind: "change-workspace" }, [
                session("a.md", "x"),
                session("c.md", "y"),
            ]),
        ).toBe("c");
        expect(failedNoteName({ kind: "close-window" }, [])).toBe("");
    });
});
