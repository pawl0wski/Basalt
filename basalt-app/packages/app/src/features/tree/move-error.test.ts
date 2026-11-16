import { describe, expect, it } from "vitest";
import { initI18n } from "../../i18n";
import i18next from "i18next";
import { beforeAll } from "vitest";
import { describeMoveError } from "./move-error";

describe("describeMoveError", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("names the colliding note", () => {
        const text = describeMoveError(i18next.t, {
            code: "already-exists",
            message: "English",
            detail: { kind: "move-collision", name: "Plan.md" },
        });

        expect(text).toBe(
            '"Plan.md" already exists in the destination. Nothing was moved.',
        );
    });

    it("reports the count, the failing note and the localised reason", () => {
        const text = describeMoveError(i18next.t, {
            code: "permission-denied",
            message: "English",
            detail: {
                kind: "move-stopped",
                name: "b.md",
                moved: 2,
                total: 5,
                linksOnly: false,
            },
        });

        expect(text).toBe(
            'Moved 2 of 5 notes. "b.md" could not be moved: The workspace folder is read-only. Nothing was changed.',
        );
    });

    it("says when only the links could not be updated", () => {
        const text = describeMoveError(i18next.t, {
            code: "unknown",
            message: "English",
            detail: {
                kind: "move-stopped",
                name: "n.md",
                moved: 1,
                total: 1,
                linksOnly: true,
            },
        });

        expect(text).toContain(
            '"n.md" was moved but its links could not be updated',
        );
    });

    it("falls back to the message of the error code without a detail", () => {
        expect(
            describeMoveError(i18next.t, { code: "unknown", message: "x" }),
        ).toBe("Something went wrong. Nothing was changed.");
    });
});
