export type Rgb = [number, number, number];

export function resolveColor(token: string): Rgb {
    const probe = document.createElement("span");
    probe.style.color = `var(--bs-${token})`;
    document.documentElement.append(probe);
    const [r, g, b] = (
        getComputedStyle(probe).color.match(/[\d.]+/g) ?? []
    ).map(Number);
    probe.remove();
    return [r, g, b];
}

export const toHex = ([r, g, b]: Rgb): string =>
    `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

const luminance = (rgb: Rgb): number => {
    const [r, g, b] = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.03928
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function contrastRatio(a: Rgb, b: Rgb): number {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

export const readToken = (name: string): string =>
    getComputedStyle(document.documentElement)
        .getPropertyValue(`--bs-${name}`)
        .trim();
