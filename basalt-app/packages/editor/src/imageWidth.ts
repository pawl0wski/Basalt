export const MIN_IMAGE_WIDTH = 40;
export const MAX_IMAGE_WIDTH = 2000;

export type ImageAlt = { alt: string; width: number | null };

export function clampImageWidth(width: number): number {
    if (!Number.isFinite(width)) return MIN_IMAGE_WIDTH;
    return Math.min(
        MAX_IMAGE_WIDTH,
        Math.max(MIN_IMAGE_WIDTH, Math.round(width)),
    );
}

export function parseImageAlt(raw: string): ImageAlt {
    const match = /^([\s\S]*)\|(\d{1,6})$/.exec(raw);
    if (!match) return { alt: raw, width: null };
    return { alt: match[1], width: clampImageWidth(Number(match[2])) };
}

export function formatImageAlt(alt: string, width: number | null): string {
    return width === null ? alt : `${alt}|${clampImageWidth(width)}`;
}
