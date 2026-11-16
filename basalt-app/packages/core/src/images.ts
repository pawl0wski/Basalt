export type ImageFormat = "png" | "jpeg" | "gif" | "webp" | "avif" | "svg";

export interface ImageDimensions {
    readonly width: number;
    readonly height: number;
}

export interface ImageInfo {
    readonly format: ImageFormat;
    readonly dimensions: ImageDimensions | null;
}

export interface ImageFormatDefinition {
    readonly mime: string;
    readonly extensions: readonly string[];
    readonly canonicalExtension: string;
}

export const IMAGE_FORMATS: Readonly<
    Record<ImageFormat, ImageFormatDefinition>
> = {
    png: {
        mime: "image/png",
        extensions: [".png"],
        canonicalExtension: ".png",
    },
    jpeg: {
        mime: "image/jpeg",
        extensions: [".jpg", ".jpeg"],
        canonicalExtension: ".jpg",
    },
    gif: {
        mime: "image/gif",
        extensions: [".gif"],
        canonicalExtension: ".gif",
    },
    webp: {
        mime: "image/webp",
        extensions: [".webp"],
        canonicalExtension: ".webp",
    },
    avif: {
        mime: "image/avif",
        extensions: [".avif"],
        canonicalExtension: ".avif",
    },
    svg: {
        mime: "image/svg+xml",
        extensions: [".svg"],
        canonicalExtension: ".svg",
    },
};

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 100_000_000;

const SVG_SNIFF_BYTES = 64 * 1024;
const AVIF_SCAN_BYTES = 4096;

export function exceedsImageLimits(
    size: number,
    info: ImageInfo | null,
): boolean {
    if (size > MAX_IMAGE_BYTES) return true;
    if (info?.dimensions == null) return false;
    return info.dimensions.width * info.dimensions.height > MAX_IMAGE_PIXELS;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
    let text = "";
    for (let index = start; index < start + length; index++) {
        if (index >= bytes.length) return "";
        text += String.fromCharCode(bytes[index] ?? 0);
    }
    return text;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
    return signature.every((value, index) => bytes[index] === value);
}

function u16be(bytes: Uint8Array, at: number): number {
    return ((bytes[at] ?? 0) << 8) | (bytes[at + 1] ?? 0);
}

function u16le(bytes: Uint8Array, at: number): number {
    return (bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8);
}

function u24le(bytes: Uint8Array, at: number): number {
    return u16le(bytes, at) | ((bytes[at + 2] ?? 0) << 16);
}

function u32be(bytes: Uint8Array, at: number): number {
    return (u16be(bytes, at) * 65536 + u16be(bytes, at + 2)) >>> 0;
}

function dimensions(width: number, height: number): ImageDimensions | null {
    return width > 0 && height > 0 ? { width, height } : null;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngDimensions(bytes: Uint8Array): ImageDimensions | null {
    if (bytes.length < 24 || ascii(bytes, 12, 4) !== "IHDR") return null;
    return dimensions(u32be(bytes, 16), u32be(bytes, 20));
}

function gifDimensions(bytes: Uint8Array): ImageDimensions | null {
    if (bytes.length < 10) return null;
    return dimensions(u16le(bytes, 6), u16le(bytes, 8));
}

function jpegDimensions(bytes: Uint8Array): ImageDimensions | null {
    let at = 2;
    while (at + 4 <= bytes.length) {
        if (bytes[at] !== 0xff) return null;
        const marker = bytes[at + 1] ?? 0;
        if (marker === 0xff) {
            at += 1;
            continue;
        }
        if (
            marker === 0xd8 ||
            (marker >= 0xd0 && marker <= 0xd7) ||
            marker === 0x01
        ) {
            at += 2;
            continue;
        }
        const length = u16be(bytes, at + 2);
        const isFrame =
            marker >= 0xc0 &&
            marker <= 0xcf &&
            ![0xc4, 0xc8, 0xcc].includes(marker);
        if (isFrame) {
            if (at + 9 > bytes.length) return null;
            return dimensions(u16be(bytes, at + 7), u16be(bytes, at + 5));
        }
        if (length < 2) return null;
        at += 2 + length;
    }
    return null;
}

function webpDimensions(bytes: Uint8Array): ImageDimensions | null {
    const chunk = ascii(bytes, 12, 4);
    if (chunk === "VP8 ") {
        if (bytes.length < 30) return null;
        if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
            return null;
        }
        return dimensions(u16le(bytes, 26) & 0x3fff, u16le(bytes, 28) & 0x3fff);
    }
    if (chunk === "VP8L") {
        if (bytes.length < 25 || bytes[20] !== 0x2f) return null;
        const b0 = bytes[21] ?? 0;
        const b1 = bytes[22] ?? 0;
        const b2 = bytes[23] ?? 0;
        const b3 = bytes[24] ?? 0;
        const width = 1 + (b0 | ((b1 & 0x3f) << 8));
        const height = 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10));
        return dimensions(width, height);
    }
    if (chunk === "VP8X") {
        if (bytes.length < 30) return null;
        return dimensions(u24le(bytes, 24) + 1, u24le(bytes, 27) + 1);
    }
    return null;
}

function isAvif(bytes: Uint8Array): boolean {
    if (ascii(bytes, 4, 4) !== "ftyp") return false;
    const boxSize = Math.min(u32be(bytes, 0), bytes.length, AVIF_SCAN_BYTES);
    const brands = [ascii(bytes, 8, 4)];
    for (let at = 16; at + 4 <= boxSize; at += 4)
        brands.push(ascii(bytes, at, 4));
    return brands.some((brand) => brand === "avif" || brand === "avis");
}

function avifDimensions(bytes: Uint8Array): ImageDimensions | null {
    const limit = Math.min(bytes.length, AVIF_SCAN_BYTES * 4);
    for (let at = 0; at + 16 <= limit; at++) {
        if (ascii(bytes, at, 4) === "ispe") {
            return dimensions(u32be(bytes, at + 8), u32be(bytes, at + 12));
        }
    }
    return null;
}

function isSvg(bytes: Uint8Array): boolean {
    let text = new TextDecoder("utf-8").decode(
        bytes.subarray(0, SVG_SNIFF_BYTES),
    );
    if (text.startsWith("﻿")) text = text.slice(1);
    let rest = text.trimStart();
    for (let guard = 0; guard < 64; guard++) {
        if (rest.startsWith("<?")) {
            const end = rest.indexOf("?>");
            if (end < 0) return false;
            rest = rest.slice(end + 2).trimStart();
        } else if (rest.startsWith("<!--")) {
            const end = rest.indexOf("-->");
            if (end < 0) return false;
            rest = rest.slice(end + 3).trimStart();
        } else if (/^<!doctype/i.test(rest)) {
            const subset = rest.indexOf("[");
            const close = rest.indexOf(">");
            const end =
                subset >= 0 && subset < close ? rest.indexOf("]>") + 1 : close;
            if (end <= 0) return false;
            rest = rest.slice(end + 1).trimStart();
        } else {
            break;
        }
    }
    return /^<svg[\s>/]/.test(rest);
}

export function detectImage(bytes: Uint8Array): ImageInfo | null {
    if (bytes.length === 0) return null;
    if (startsWith(bytes, PNG_SIGNATURE)) {
        return { format: "png", dimensions: pngDimensions(bytes) };
    }
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
        return { format: "jpeg", dimensions: jpegDimensions(bytes) };
    }
    const head = ascii(bytes, 0, 6);
    if (head === "GIF87a" || head === "GIF89a") {
        return { format: "gif", dimensions: gifDimensions(bytes) };
    }
    if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
        return { format: "webp", dimensions: webpDimensions(bytes) };
    }
    if (isAvif(bytes)) {
        return { format: "avif", dimensions: avifDimensions(bytes) };
    }
    if (isSvg(bytes)) return { format: "svg", dimensions: null };
    return null;
}
