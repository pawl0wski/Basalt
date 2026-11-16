import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
    attachmentExtension,
    pastedImageBaseName,
    planAttachmentName,
    sanitizeFileName,
    splitFileName,
} from "./attachment-names";
import { validateNoteName } from "./workspace-path";

const bytes = (text: string) => new TextEncoder().encode(text).length;
const keys = (...names: string[]) =>
    new Set(names.map((n) => n.toLowerCase().normalize("NFC")));

describe("splitFileName", () => {
    it.each([
        ["my.photo.v2.png", "my.photo.v2", ".png"],
        ["noext", "noext", ""],
        [".hidden", ".hidden", ""],
        ["a.", "a.", ""],
        ["a.PNG", "a", ".PNG"],
    ])("%s", (name, stem, extension) => {
        expect(splitFileName(name)).toEqual({ stem, extension });
    });
});

describe("sanitizeFileName", () => {
    it.each([
        ["a/b.png", "a-b.png"],
        ["..\\x.png", "-x.png"],
        ["a:b*c?.png", "a-b-c-.png"],
        [".hidden.png", "hidden.png"],
        ["trail. .png", "trail.png"],
        ["con.png", "con_.png"],
        ["NUL", "NUL_"],
        ["lpt1.x.png", "lpt1_.x.png"],
        ["", "file"],
        ["...", "file"],
    ])("%j becomes %j", (input, expected) => {
        expect(sanitizeFileName(input)).toBe(expected);
    });

    it("uses the given fallback for an empty stem", () => {
        expect(sanitizeFileName("", "Pasted image 1")).toBe("Pasted image 1");
    });

    it("shortens the stem so the name fits 255 UTF-8 bytes without cutting a character", () => {
        const name = `${"ż".repeat(200)}.png`;
        const result = sanitizeFileName(name);
        expect(bytes(result)).toBeLessThanOrEqual(255);
        expect(result.endsWith(".png")).toBe(true);
        expect(result).not.toContain("�");
        expect(bytes(sanitizeFileName(name, "f", 8))).toBeLessThanOrEqual(247);
    });

    it("always yields a name that passes note-name validation", () => {
        fc.assert(
            fc.property(fc.string({ unit: "binary" }), (input) => {
                const result = sanitizeFileName(input);
                expect(validateNoteName(result)).toEqual({ valid: true });
            }),
            { numRuns: 500 },
        );
    });
});

describe("pastedImageBaseName", () => {
    it("formats local time as YYYYMMDDHHmmss", () => {
        expect(pastedImageBaseName(new Date(2026, 9, 5, 4, 3, 2))).toBe(
            "Pasted image 20261005040302",
        );
    });
});

describe("attachmentExtension", () => {
    it("keeps accepted extensions with their case and replaces others", () => {
        expect(attachmentExtension(".JPG", "jpeg")).toBe(".JPG");
        expect(attachmentExtension(".jpeg", "jpeg")).toBe(".jpeg");
        expect(attachmentExtension(".png", "jpeg")).toBe(".jpg");
        expect(attachmentExtension("", "png")).toBe(".png");
        expect(attachmentExtension(".PNG", "png")).toBe(".PNG");
    });
});

describe("planAttachmentName", () => {
    const now = new Date(2026, 9, 25, 14, 30, 12);

    it("names an unnamed clipboard image by time with the canonical extension", () => {
        expect(
            planAttachmentName({
                originalName: null,
                format: "png",
                now,
                taken: keys(),
            }),
        ).toBe("Pasted image 20261025143012.png");
    });

    it("keeps generic browser names as given and fixes a mismatching extension", () => {
        expect(
            planAttachmentName({
                originalName: "image.png",
                format: "png",
                now,
                taken: keys(),
            }),
        ).toBe("image.png");
        expect(
            planAttachmentName({
                originalName: "photo.png",
                format: "jpeg",
                now,
                taken: keys(),
            }),
        ).toBe("photo.jpg");
        expect(
            planAttachmentName({
                originalName: "IMG_001.JPG",
                format: "jpeg",
                now,
                taken: keys(),
            }),
        ).toBe("IMG_001.JPG");
    });

    it("adds numbered suffixes, counting case-only and Unicode-form-only collisions", () => {
        const taken = keys("Pic.png", "pic 1.png", "é.png");
        expect(
            planAttachmentName({
                originalName: "pic.png",
                format: "png",
                now,
                taken,
            }),
        ).toBe("pic 2.png");
        expect(
            planAttachmentName({
                originalName: "é.png",
                format: "png",
                now,
                taken,
            }),
        ).toBe("é 1.png");
    });

    it("two pastes in the same second get the suffix", () => {
        const first = planAttachmentName({
            originalName: null,
            format: "png",
            now,
            taken: keys(),
        });
        expect(
            planAttachmentName({
                originalName: null,
                format: "png",
                now,
                taken: keys(first),
            }),
        ).toBe("Pasted image 20261025143012 1.png");
    });

    it("sanitizes unsafe names and keeps suffixed names within 255 bytes", () => {
        expect(
            planAttachmentName({
                originalName: "../x.png",
                format: "png",
                now,
                taken: keys(),
            }),
        ).toBe("-x.png");
        const long = `${"a".repeat(300)}.png`;
        const first = planAttachmentName({
            originalName: long,
            format: "png",
            now,
            taken: keys(),
        });
        const second = planAttachmentName({
            originalName: long,
            format: "png",
            now,
            taken: keys(first),
        });
        expect(bytes(second)).toBeLessThanOrEqual(255);
        expect(second).not.toBe(first);
    });

    it("treats a blank original name as unnamed", () => {
        expect(
            planAttachmentName({
                originalName: "  ",
                format: "gif",
                now,
                taken: keys(),
            }),
        ).toBe("Pasted image 20261025143012.gif");
    });
});
