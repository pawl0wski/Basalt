import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = resolve(import.meta.dirname, "check-tokens.ts");

describe("check-tokens CLI", () => {
    let directory: string;

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), "check-tokens-"));
    });

    afterEach(() => {
        rmSync(directory, { recursive: true, force: true });
    });

    function run(...targets: string[]) {
        return spawnSync(process.execPath, [script, ...targets], {
            encoding: "utf8",
        });
    }

    it("exits with code 1 and reports the location of a value outside the tokens", () => {
        const file = join(directory, "Card.tsx");
        writeFileSync(
            file,
            'export const Card = () => <div className="p-[13px] bg-zinc-900" />;\n',
        );

        const result = run(file);

        expect(result.status).toBe(1);
        expect(result.stdout).toContain("Card.tsx:1:");
        expect(result.stdout).toContain("p-[13px]");
        expect(result.stdout).toContain("bg-zinc-900");
    });

    it("exits with code 0 when only token classes are used", () => {
        const file = join(directory, "Card.tsx");
        writeFileSync(
            file,
            'export const Card = () => <div className="bg-surface-card gap-in-group" />;\n',
        );

        const result = run(file);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("No values outside the tokens.");
    });

    it("scans every file inside a directory target", () => {
        writeFileSync(join(directory, "ok.ts"), "export const a = 1;\n");
        writeFileSync(join(directory, "bad.css"), ".x { color: #ff0000; }\n");

        const result = run(directory);

        expect(result.status).toBe(1);
        expect(result.stdout).toContain("bad.css:1:");
    });

    it("passes on the default project roots", () => {
        const result = spawnSync(process.execPath, [script], {
            encoding: "utf8",
        });

        expect(result.stdout).toContain("No values outside the tokens.");
        expect(result.status).toBe(0);
    });
});
