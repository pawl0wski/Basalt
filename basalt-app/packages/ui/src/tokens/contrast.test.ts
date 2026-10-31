import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastPairs, thresholds } from "./contrastPairs";

const read = (file: string) =>
    readFileSync(join(import.meta.dirname, file), "utf8");

const declarations = new Map<string, string>();
for (const file of ["raw.css", "semantic.css", "component.css"]) {
    for (const match of read(file).matchAll(
        /^\s*(--[a-z0-9-]+):\s*([^;]+);/gm,
    )) {
        declarations.set(match[1], match[2].trim());
    }
}

function resolve(name: string): string {
    const value = declarations.get(name);
    if (value === undefined) throw new Error(`Unknown token ${name}`);
    const reference = value.match(/^var\((--[a-z0-9-]+)\)$/);
    return reference ? resolve(reference[1]) : value;
}

function luminance(hex: string): number {
    const channels = [1, 3, 5].map((index) => {
        const value = parseInt(hex.slice(index, index + 2), 16) / 255;
        return value <= 0.03928
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
    const [light, dark] = [luminance(foreground), luminance(background)].sort(
        (a, b) => b - a,
    );
    return (light + 0.05) / (dark + 0.05);
}

describe("dark theme contrast", () => {
    for (const pair of contrastPairs) {
        const label = `${pair.foreground} on ${pair.background}`;
        const ratio = contrast(
            resolve(`--bs-${pair.foreground}`),
            resolve(`--bs-${pair.background}`),
        );
        if (pair.verdict === "pass") {
            it(`${label} meets ${thresholds[pair.kind]}:1`, () => {
                expect(ratio).toBeGreaterThanOrEqual(thresholds[pair.kind]);
            });
        } else if (pair.verdict === "fail") {
            it(`${label} is a documented failure`, () => {
                expect(ratio).toBeLessThan(thresholds[pair.kind]);
            });
        }
    }

    it("resolves the documented accent text colour", () => {
        expect(resolve("--bs-text-link")).toBe(resolve("--raw-blue-300"));
    });
});
