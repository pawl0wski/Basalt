import { describe, expect, it } from "vitest";
import {
    MAX_IMAGE_WIDTH,
    MIN_IMAGE_WIDTH,
    clampImageWidth,
    formatImageAlt,
    parseImageAlt,
} from "./imageWidth";

describe("clampImageWidth", () => {
    it("clamps to the bounds and rounds", () => {
        expect(clampImageWidth(10)).toBe(MIN_IMAGE_WIDTH);
        expect(clampImageWidth(5000)).toBe(MAX_IMAGE_WIDTH);
        expect(clampImageWidth(300.6)).toBe(301);
    });

    it("falls back to the minimum for non-finite input", () => {
        expect(clampImageWidth(Number.NaN)).toBe(MIN_IMAGE_WIDTH);
        expect(clampImageWidth(Number.POSITIVE_INFINITY)).toBe(MIN_IMAGE_WIDTH);
    });
});

describe("parseImageAlt", () => {
    it("reads the pipe suffix as the width", () => {
        expect(parseImageAlt("photo|300")).toEqual({
            alt: "photo",
            width: 300,
        });
    });

    it("keeps an alt without a suffix", () => {
        expect(parseImageAlt("photo")).toEqual({ alt: "photo", width: null });
        expect(parseImageAlt("")).toEqual({ alt: "", width: null });
    });

    it("splits only the last pipe and ignores non-numeric suffixes", () => {
        expect(parseImageAlt("a|b|120")).toEqual({ alt: "a|b", width: 120 });
        expect(parseImageAlt("a|wide")).toEqual({
            alt: "a|wide",
            width: null,
        });
        expect(parseImageAlt("a|300x200")).toEqual({
            alt: "a|300x200",
            width: null,
        });
    });

    it("clamps a stored width outside the bounds", () => {
        expect(parseImageAlt("a|5").width).toBe(MIN_IMAGE_WIDTH);
        expect(parseImageAlt("a|99999").width).toBe(MAX_IMAGE_WIDTH);
    });

    it("accepts an empty alt with a width", () => {
        expect(parseImageAlt("|300")).toEqual({ alt: "", width: 300 });
    });
});

describe("formatImageAlt", () => {
    it("appends the clamped width or removes it", () => {
        expect(formatImageAlt("photo", 300)).toBe("photo|300");
        expect(formatImageAlt("photo", 1)).toBe("photo|40");
        expect(formatImageAlt("photo", null)).toBe("photo");
    });

    it("round-trips with parseImageAlt", () => {
        expect(parseImageAlt(formatImageAlt("a|b", 250))).toEqual({
            alt: "a|b",
            width: 250,
        });
    });
});
