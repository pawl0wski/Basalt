import { APP_ERROR_CODES } from "@basalt/core";
import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { openErrorMessage } from "./open-error-message";

describe("openErrorMessage", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("words the four open failures specifically", () => {
        const t = i18next.t.bind(i18next);

        expect(openErrorMessage(t, "too-large")).toBe(
            en.notes.openError["too-large"],
        );
        expect(openErrorMessage(t, "not-utf8")).toBe(
            en.notes.openError["not-utf8"],
        );
        expect(openErrorMessage(t, "invalid-path")).toBe(
            en.notes.openError.symlink,
        );
        expect(openErrorMessage(t, "unknown")).toBe(en.notes.openError.unknown);
        expect(openErrorMessage(t, "not-a-file")).toBe(en.errors["not-a-file"]);
        expect(openErrorMessage(t, "not-a-file")).not.toBe(
            en.notes.openError.symlink,
        );
    });

    it("falls back to the shared error text for every other code", () => {
        const t = i18next.t.bind(i18next);

        for (const code of APP_ERROR_CODES) {
            expect(openErrorMessage(t, code)).not.toBe("");
            expect(openErrorMessage(t, code)).not.toContain("errors.");
        }
        expect(openErrorMessage(t, "permission-denied")).toBe(
            en.errors["permission-denied"],
        );
        expect(openErrorMessage(t, "scope-denied")).toBe(
            en.errors["scope-denied"],
        );
        expect(openErrorMessage(t, "scope-denied")).not.toBe(
            en.errors["permission-denied"],
        );
    });
});
