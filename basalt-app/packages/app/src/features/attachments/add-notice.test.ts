import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import { initI18n } from "../../i18n";
import { noticeFor, noticeText } from "./add-notice";

describe("add notice", () => {
    beforeAll(async () => {
        await initI18n();
    });
    const t = i18next.t.bind(i18next);

    it("is empty when nothing failed", () => {
        expect(
            noticeFor({ links: ["x"], failed: 0, firstFailure: null }),
        ).toBeNull();
    });

    it("counts the skipped files and keeps the first reason", () => {
        expect(
            noticeFor({ links: [], failed: 2, firstFailure: "unsupported" }),
        ).toEqual({
            failed: 2,
            reason: "unsupported",
        });
    });

    it("words one and many files and picks an image-specific text for too-large", () => {
        expect(noticeText(t, { failed: 1, reason: "unsupported" })).toBe(
            "1 file was not added: This file format is not supported.",
        );
        expect(noticeText(t, { failed: 2, reason: "permission-denied" })).toBe(
            "2 files were not added: The workspace folder is read-only. Nothing was changed.",
        );
        expect(noticeText(t, { failed: 3, reason: "too-large" })).toBe(
            "3 files were not added: the image is over 20 MiB or 100 megapixels.",
        );
    });
});
