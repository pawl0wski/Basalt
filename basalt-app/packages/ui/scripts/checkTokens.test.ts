import { describe, expect, it } from "vitest";
import { findViolations } from "./checkTokens";

const categories = (source: string) =>
    findViolations(source, "x.tsx").map((violation) => violation.category);

describe("findViolations", () => {
    it("finds colours written outside the token files", () => {
        expect(categories('<div style={{ color: "#fff" }} />')).toEqual(["color literal"]);
        expect(categories("color: rgb(0 0 0 / 50%)")).toEqual(["color literal"]);
        expect(categories("color: oklch(0.5 0.1 200)")).toEqual(["color literal"]);
        expect(categories("background: hsl(210 10% 10%)")).toEqual(["color literal"]);
    });

    it("finds Tailwind palette classes, including with variants and opacity", () => {
        expect(categories('className="bg-zinc-900"')).toEqual(["Tailwind palette class"]);
        expect(categories('className="text-white"')).toEqual(["Tailwind palette class"]);
        expect(categories('className="hover:bg-blue-500/50"')).toEqual(["Tailwind palette class"]);
    });

    it("finds arbitrary values but not arbitrary variants", () => {
        expect(categories('className="p-[13px]"')).toEqual(["arbitrary Tailwind value"]);
        expect(categories('className="grid-cols-[auto_1fr]"')).toEqual(["arbitrary Tailwind value"]);
        expect(categories('className="data-[state=open]:bg-surface-raised"')).toEqual([]);
    });

    it("finds scale classes that no token provides", () => {
        expect(categories('className="p-4 gap-2"')).toEqual([
            "numeric scale class (no such token)",
            "numeric scale class (no such token)",
        ]);
        expect(categories('className="basis-1/3"')).toEqual([]);
    });

    it("finds shadows, large radii, gradients and blur", () => {
        expect(categories('className="rounded-2xl shadow-xl"')).toEqual([
            "shape or effect outside the tokens",
            "shape or effect outside the tokens",
        ]);
        expect(categories('className="bg-gradient-to-r backdrop-blur-md"')).toHaveLength(2);
    });

    it("skips inline code and fences marked bad in MDX, but checks other fences and JSX", () => {
        const mdx = [
            "Do not use `p-[13px]` or `bg-zinc-900`.",
            "```tsx bad",
            '<div className="text-white" />',
            "```",
            "```tsx",
            '<div className="bg-black" />',
            "```",
            '<div className="gap-3" />',
        ].join("\n");
        expect(findViolations(mdx, "x.mdx").map((violation) => violation.match)).toEqual([
            "bg-black",
            "gap-3",
        ]);
    });

    it("accepts token classes", () => {
        expect(
            categories(
                'className="bg-surface-editor text-text-muted p-panel gap-in-group rounded-control border border-border-divider text-size-ui h-icon-button"',
            ),
        ).toEqual([]);
    });

    it("reports line and column", () => {
        const [violation] = findViolations('a\n  <p className="text-white" />', "f.tsx");
        expect(violation).toMatchObject({ file: "f.tsx", line: 2, column: 17, match: "text-white" });
    });
});
