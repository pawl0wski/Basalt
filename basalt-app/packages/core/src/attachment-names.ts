import { IMAGE_FORMATS, type ImageFormat } from "./images";
import {
    CONTROL_CHARACTERS,
    FORBIDDEN_NAME_CHARACTERS,
    MAX_NAME_BYTES,
    RESERVED_WINDOWS_NAMES,
    pathKey,
    type WorkspacePath,
} from "./workspace-path";

const SEPARATORS = /[/\\]/g;
const FORBIDDEN_GLOBAL = new RegExp(FORBIDDEN_NAME_CHARACTERS.source, "g");
const CONTROL_GLOBAL = new RegExp(CONTROL_CHARACTERS.source, "gu");
const SUFFIX_ROOM_BYTES = 8;

const encoder = new TextEncoder();

function byteLength(text: string): number {
    return encoder.encode(text).length;
}

function truncateToBytes(text: string, maxBytes: number): string {
    let result = "";
    let used = 0;
    for (const char of text) {
        const size = byteLength(char);
        if (used + size > maxBytes) break;
        result += char;
        used += size;
    }
    return result;
}

export function splitFileName(name: string): {
    stem: string;
    extension: string;
} {
    const dot = name.lastIndexOf(".");
    if (dot <= 0 || dot === name.length - 1) {
        return { stem: name, extension: "" };
    }
    return { stem: name.slice(0, dot), extension: name.slice(dot) };
}

function cleanText(text: string): string {
    return text
        .replace(SEPARATORS, "-")
        .replace(FORBIDDEN_GLOBAL, "-")
        .replace(CONTROL_GLOBAL, "-");
}

export function sanitizeFileName(
    name: string,
    fallbackBase = "file",
    reserveBytes = 0,
): string {
    const cleaned = cleanText(name).replace(/^[.\s]+/, "");
    const { stem: rawStem, extension: rawExtension } = splitFileName(cleaned);
    const extension = rawExtension.replace(/[. ]+$/, "");
    let stem = rawStem.replace(/[. ]+$/, "");
    if (stem === "") stem = cleanText(fallbackBase).replace(/^[.\s]+/, "");
    if (stem === "") stem = "file";
    const firstPart = stem.split(".")[0] ?? "";
    if (RESERVED_WINDOWS_NAMES.test(firstPart)) {
        stem = `${firstPart}_${stem.slice(firstPart.length)}`;
    }
    const room = MAX_NAME_BYTES - byteLength(extension) - reserveBytes;
    stem = truncateToBytes(stem, Math.max(1, room)).replace(/[. ]+$/, "");
    if (stem === "") stem = "file";
    return `${stem}${extension}`;
}

export function pastedImageBaseName(now: Date): string {
    const two = (value: number) => String(value).padStart(2, "0");
    return (
        "Pasted image " +
        `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}` +
        `${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`
    );
}

export function attachmentExtension(
    originalExtension: string,
    format: ImageFormat,
): string {
    const definition = IMAGE_FORMATS[format];
    return definition.extensions.includes(originalExtension.toLowerCase())
        ? originalExtension
        : definition.canonicalExtension;
}

export function planAttachmentName(input: {
    originalName: string | null;
    format: ImageFormat;
    now: Date;
    taken: ReadonlySet<string>;
}): string {
    const { originalName, format, now, taken } = input;
    const named = originalName !== null && originalName.trim() !== "";
    const split = named
        ? splitFileName(originalName)
        : { stem: pastedImageBaseName(now), extension: "" };
    const extension = attachmentExtension(split.extension, format);
    const base = sanitizeFileName(
        `${split.stem}${extension}`,
        pastedImageBaseName(now),
        SUFFIX_ROOM_BYTES,
    );
    const stem = base.slice(0, base.length - extension.length);
    for (let index = 0; ; index++) {
        const candidate = index === 0 ? base : `${stem} ${index}${extension}`;
        if (!taken.has(pathKey(candidate as WorkspacePath))) return candidate;
    }
}
