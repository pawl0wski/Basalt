import { APP_ERROR_CODES } from "@basalt/core";
import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { placeholderKeyFor, toImageSource } from "./image-source";
import type { ImageLoadFailure } from "./image-loader";

const reasons: ImageLoadFailure[] = [
    ...APP_ERROR_CODES,
    "remote",
    "invalid",
    "unsupported-scheme",
];

describe("placeholderKeyFor", () => {
    it("maps every failure reason to an existing placeholder text", () => {
        for (const reason of reasons) {
            expect(Object.keys(en.attachments.placeholder)).toContain(
                placeholderKeyFor(reason),
            );
        }
    });

    it.each([
        ["not-found", "missing"],
        ["invalid-path", "unreadable"],
        ["permission-denied", "unreadable"],
        ["unknown", "unreadable"],
        ["too-large", "tooLarge"],
        ["unsupported", "unsupported"],
        ["remote", "remote"],
        ["invalid", "invalid"],
        ["unsupported-scheme", "unsupportedScheme"],
    ] as const)("%s shows %s", (reason, key) => {
        expect(placeholderKeyFor(reason)).toBe(key);
    });
});

describe("toImageSource", () => {
    beforeAll(async () => {
        await initI18n();
    });

    const t = i18next.t.bind(i18next);

    it("passes src and header dimensions through", () => {
        expect(
            toImageSource(
                {
                    kind: "image",
                    src: "blob:1",
                    dimensions: { width: 3, height: 2 },
                },
                "x.png",
                t,
            ),
        ).toEqual({ kind: "image", src: "blob:1", width: 3, height: 2 });
        expect(
            toImageSource(
                { kind: "image", src: "blob:1", dimensions: null },
                "x.png",
                t,
            ),
        ).toEqual({ kind: "image", src: "blob:1", width: null, height: null });
    });

    it("names the missing path in the placeholder", () => {
        expect(
            toImageSource(
                { kind: "failed", reason: "not-found" },
                "attachments/x.png",
                t,
            ),
        ).toEqual({
            kind: "placeholder",
            label: "Image not found: attachments/x.png",
        });
    });

    it("explains remote images", () => {
        expect(
            toImageSource({ kind: "failed", reason: "remote" }, "https://x", t),
        ).toEqual({
            kind: "placeholder",
            label: "Remote images are not loaded",
        });
    });
});
