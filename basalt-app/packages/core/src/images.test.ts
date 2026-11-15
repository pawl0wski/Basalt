import { describe, expect, it } from "vitest";
import {
    IMAGE_FORMATS,
    MAX_IMAGE_BYTES,
    MAX_IMAGE_PIXELS,
    detectImage,
    exceedsImageLimits,
} from "./images";

const text = (value: string) => [...new TextEncoder().encode(value)];
const be32 = (n: number) => [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
];
const le16 = (n: number) => [n & 255, (n >> 8) & 255];

function png(width: number, height: number): Uint8Array {
    return Uint8Array.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...be32(13),
        ...text("IHDR"),
        ...be32(width),
        ...be32(height),
        8,
        6,
        0,
        0,
        0,
    ]);
}

function gif(width: number, height: number): Uint8Array {
    return Uint8Array.from([
        ...text("GIF89a"),
        ...le16(width),
        ...le16(height),
        0,
        0,
        0,
    ]);
}

function jpeg(width: number, height: number): Uint8Array {
    return Uint8Array.from([
        0xff,
        0xd8,
        0xff,
        0xe0,
        0x00,
        0x04,
        0x4a,
        0x46,
        0xff,
        0xc4,
        0x00,
        0x02,
        0xff,
        0xc0,
        0x00,
        0x0b,
        8,
        (height >> 8) & 255,
        height & 255,
        (width >> 8) & 255,
        width & 255,
        1,
        1,
        0x11,
        0,
    ]);
}

function webpLossy(width: number, height: number): Uint8Array {
    return Uint8Array.from([
        ...text("RIFF"),
        0,
        0,
        0,
        0,
        ...text("WEBP"),
        ...text("VP8 "),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0x9d,
        0x01,
        0x2a,
        ...le16(width),
        ...le16(height),
    ]);
}

function webpLossless(width: number, height: number): Uint8Array {
    const w = width - 1;
    const h = height - 1;
    return Uint8Array.from([
        ...text("RIFF"),
        0,
        0,
        0,
        0,
        ...text("WEBP"),
        ...text("VP8L"),
        0,
        0,
        0,
        0,
        0x2f,
        w & 255,
        ((w >> 8) & 0x3f) | ((h & 3) << 6),
        (h >> 2) & 255,
        (h >> 10) & 0x0f,
    ]);
}

function webpExtended(width: number, height: number): Uint8Array {
    const w = width - 1;
    const h = height - 1;
    return Uint8Array.from([
        ...text("RIFF"),
        0,
        0,
        0,
        0,
        ...text("WEBP"),
        ...text("VP8X"),
        10,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        w & 255,
        (w >> 8) & 255,
        (w >> 16) & 255,
        h & 255,
        (h >> 8) & 255,
        (h >> 16) & 255,
    ]);
}

function avif(width: number, height: number): Uint8Array {
    return Uint8Array.from([
        ...be32(24),
        ...text("ftyp"),
        ...text("avif"),
        0,
        0,
        0,
        0,
        ...text("mif1"),
        ...text("avif"),
        ...be32(20),
        ...text("ispe"),
        0,
        0,
        0,
        0,
        ...be32(width),
        ...be32(height),
    ]);
}

describe("detectImage", () => {
    it("reads PNG format and dimensions", () => {
        expect(detectImage(png(30, 20))).toEqual({
            format: "png",
            dimensions: { width: 30, height: 20 },
        });
    });

    it("reads GIF dimensions", () => {
        expect(detectImage(gif(7, 9))).toEqual({
            format: "gif",
            dimensions: { width: 7, height: 9 },
        });
    });

    it("reads JPEG dimensions from the first SOF marker past other segments", () => {
        expect(detectImage(jpeg(640, 480))).toEqual({
            format: "jpeg",
            dimensions: { width: 640, height: 480 },
        });
    });

    it("reads every WebP variant", () => {
        expect(detectImage(webpLossy(100, 50))?.dimensions).toEqual({
            width: 100,
            height: 50,
        });
        expect(detectImage(webpLossless(300, 200))?.dimensions).toEqual({
            width: 300,
            height: 200,
        });
        expect(detectImage(webpExtended(1000, 2000))?.dimensions).toEqual({
            width: 1000,
            height: 2000,
        });
        expect(detectImage(webpLossy(1, 1))?.format).toBe("webp");
    });

    it("reads AVIF through the ftyp brand and ispe", () => {
        expect(detectImage(avif(64, 32))).toEqual({
            format: "avif",
            dimensions: { width: 64, height: 32 },
        });
    });

    it("does not take other ISO-BMFF files for AVIF", () => {
        const mp4 = Uint8Array.from([
            ...be32(16),
            ...text("ftyp"),
            ...text("isom"),
            0,
            0,
            0,
            0,
        ]);
        expect(detectImage(mp4)).toBeNull();
    });

    it("detects an SVG with BOM, XML declaration, comments and doctype", () => {
        const svg =
            '\uFEFF<?xml version="1.0"?>\n<!-- c -->\n<!DOCTYPE svg PUBLIC "x" "y">\n<svg xmlns="http://www.w3.org/2000/svg"/>';
        expect(detectImage(new TextEncoder().encode(svg))).toEqual({
            format: "svg",
            dimensions: null,
        });
        expect(detectImage(new TextEncoder().encode("<svg>"))?.format).toBe(
            "svg",
        );
    });

    it("detects an SVG whose doctype has an internal subset", () => {
        const svg = '<!DOCTYPE svg [<!ENTITY a "b">]><svg/>';
        expect(detectImage(new TextEncoder().encode(svg))?.format).toBe("svg");
    });

    it("keeps the format but gives no dimensions for truncated headers", () => {
        expect(detectImage(png(1, 1).subarray(0, 12))).toEqual({
            format: "png",
            dimensions: null,
        });
        expect(detectImage(jpeg(1, 1).subarray(0, 5))).toEqual({
            format: "jpeg",
            dimensions: null,
        });
    });

    it("rejects a truncated signature", () => {
        expect(detectImage(png(1, 1).subarray(0, 4))).toBeNull();
        expect(detectImage(Uint8Array.of(0xff, 0xd8))).toBeNull();
    });

    it("rejects text named like an image, html, binary data and empty input", () => {
        const encode = (value: string) => new TextEncoder().encode(value);
        expect(detectImage(encode("just a note"))).toBeNull();
        expect(detectImage(encode("<html><svg></svg></html>"))).toBeNull();
        expect(detectImage(encode("<svgx/>"))).toBeNull();
        expect(
            detectImage(Uint8Array.of(0xff, 0xfe, 0x00, 0x80, 0xc3)),
        ).toBeNull();
        expect(detectImage(new Uint8Array())).toBeNull();
    });

    it("does not throw on an unterminated SVG prologue", () => {
        const encode = (value: string) => new TextEncoder().encode(value);
        expect(detectImage(encode("<?xml "))).toBeNull();
        expect(detectImage(encode("<!-- never closed"))).toBeNull();
        expect(detectImage(encode("<!DOCTYPE svg"))).toBeNull();
    });
});

describe("exceedsImageLimits", () => {
    it("flags files over the byte limit without needing a header", () => {
        expect(exceedsImageLimits(MAX_IMAGE_BYTES, null)).toBe(false);
        expect(exceedsImageLimits(MAX_IMAGE_BYTES + 1, null)).toBe(true);
    });

    it("flags a header declaring 20000 x 20000 pixels", () => {
        const info = detectImage(png(20000, 20000));
        expect(exceedsImageLimits(100, info)).toBe(true);
    });

    it("allows exactly the pixel limit and exempts images without dimensions", () => {
        const edge = {
            format: "png",
            dimensions: { width: 10000, height: 10000 },
        } as const;
        expect(edge.dimensions.width * edge.dimensions.height).toBe(
            MAX_IMAGE_PIXELS,
        );
        expect(exceedsImageLimits(1, edge)).toBe(false);
        expect(exceedsImageLimits(1, { format: "svg", dimensions: null })).toBe(
            false,
        );
    });
});

describe("IMAGE_FORMATS", () => {
    it("maps jpeg to .jpg canonically and accepts .jpeg", () => {
        expect(IMAGE_FORMATS.jpeg.canonicalExtension).toBe(".jpg");
        expect(IMAGE_FORMATS.jpeg.extensions).toEqual([".jpg", ".jpeg"]);
        expect(IMAGE_FORMATS.svg.mime).toBe("image/svg+xml");
    });
});
