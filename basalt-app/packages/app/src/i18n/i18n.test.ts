import { APP_ERROR_CODES } from "@basalt/core";
import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import en from "./locales/en.json";
import { initI18n } from "./i18n";

function leaves(value: unknown, path = ""): [string, unknown][] {
    if (typeof value === "object" && value !== null) {
        return Object.entries(value).flatMap(([key, child]) =>
            leaves(child, path ? `${path}.${key}` : key),
        );
    }
    return [[path, value]];
}

describe("i18n", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("has user text for every AppError code", () => {
        for (const code of APP_ERROR_CODES) {
            const text = i18next.t(`errors.${code}`);
            expect(text).not.toBe(`errors.${code}`);
            expect(text.trim()).not.toBe("");
        }
        expect(Object.keys(en.errors).sort()).toEqual(
            [...APP_ERROR_CODES].sort(),
        );
    });

    it("has no empty values", () => {
        for (const [path, value] of leaves(en)) {
            expect(value, path).toSatisfy(
                (text) => typeof text === "string" && text.trim() !== "",
            );
        }
    });

    it("uses the spec texts for the word count and the default note name", () => {
        expect(i18next.t("statusBar.wordsOne")).toBe("1 word");
        expect(i18next.t("statusBar.wordsMany", { count: "1,204" })).toBe(
            "1,204 words",
        );
        expect(
            Object.keys(i18next.getResourceBundle("en", "translation")),
        ).not.toContain("saveStatus");
        expect(i18next.t("notes.untitled")).toBe("Untitled");
    });

    it("interpolates the note name in confirmation messages", () => {
        expect(i18next.t("notes.confirmReload.message", { name: "Plan" })).toBe(
            'Your unsaved changes in "Plan" will be lost.',
        );
        expect(i18next.t("notes.confirmClose.message", { name: "Plan" })).toBe(
            '"Plan" was deleted or moved. Your unsaved changes will be lost.',
        );
    });

    it("keeps English as the fallback language", () => {
        expect(i18next.language).toBe("en");
        expect(i18next.options.fallbackLng).toEqual(["en"]);
    });
});
