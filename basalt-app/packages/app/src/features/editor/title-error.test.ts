import { describe, expect, it } from "vitest";
import { createInstance } from "i18next";
import en from "../../i18n/locales/en.json";
import type { NoteSession } from "../notes/notes-store";
import { wsPath } from "../test-harness";
import { titleErrorText } from "./title-error";

async function translator() {
    const i18n = createInstance();
    await i18n.init({
        lng: "en",
        resources: { en: { translation: en } },
        interpolation: { prefix: "{", suffix: "}", escapeValue: false },
    });
    return i18n.t.bind(i18n);
}

function session(
    titleError: NoteSession["titleError"],
    path = "Plan.md",
): NoteSession {
    return {
        id: 1,
        path: wsPath(path),
        text: "",
        baseText: "",
        eol: "lf",
        bom: false,
        error: null,
        openFailed: false,
        saveStatus: "saved",
        titleError,
        titlePending: true,
    };
}

describe("titleErrorText", () => {
    it("is empty without an error", async () => {
        expect(titleErrorText(await translator(), session(null))).toBe("");
    });

    it.each([
        ["invalid-path", "cannot be used as a note name"],
        ["already-exists", "already exists"],
        ["permission-denied", "read-only"],
    ] as const)(
        "explains %s and names the current note",
        async (code, part) => {
            const text = titleErrorText(
                await translator(),
                session({ error: { code, message: "" }, linksFailed: 0 }),
            );
            expect(text).toContain(part);
            expect(text).toContain("still named Plan");
        },
    );

    it("falls back to the generic error reason", async () => {
        const text = titleErrorText(
            await translator(),
            session({
                error: { code: "unavailable", message: "" },
                linksFailed: 0,
            }),
        );
        expect(text).toContain(en.errors.unavailable);
        expect(text).toContain("still named Plan");
    });

    it("reports links that could not be updated, with the count", async () => {
        const text = titleErrorText(
            await translator(),
            session({
                error: { code: "unknown", message: "" },
                linksFailed: 3,
            }),
        );
        expect(text).toContain("3 other notes");
    });
});
