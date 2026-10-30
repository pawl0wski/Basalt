export type Violation = {
    file: string;
    line: number;
    column: number;
    category: string;
    match: string;
};

const palette =
    "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const colorUtilities =
    "bg|text|border|border-[xytblrse]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow|placeholder|inset-ring";
const spacingUtilities =
    "p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|inset|inset-x|inset-y|top|left|right|bottom|basis";
const classStart = String.raw`(?<![\w-])(?:[a-z0-9-]+:)*`;

const rules: { category: string; pattern: RegExp }[] = [
    {
        category: "color literal",
        pattern:
            /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\(/g,
    },
    {
        category: "Tailwind palette class",
        pattern: new RegExp(
            `${classStart}(?:${colorUtilities})-(?:(?:${palette})-\\d{2,3}|white|black)(?:/\\d+)?(?![\\w-])`,
            "g",
        ),
    },
    {
        category: "arbitrary Tailwind value",
        pattern: new RegExp(
            `${classStart}!?-?[a-z][a-z0-9-]*-\\[[^\\]\\s]+\\](?!:)`,
            "g",
        ),
    },
    {
        category: "numeric scale class (no such token)",
        pattern: new RegExp(
            `${classStart}-?(?:${spacingUtilities})-\\d+(?:\\.\\d+)?(?![\\w/.-])`,
            "g",
        ),
    },
    {
        category: "shape or effect outside the tokens",
        pattern: new RegExp(
            `${classStart}(?:rounded-(?:xs|sm|md|lg|xl|2xl|3xl|full)|shadow-(?:xs|sm|md|lg|xl|2xl|inner|none)|drop-shadow-\\w+|blur-\\w+|backdrop-blur(?:-\\w+)?|bg-gradient-to-\\w+|bg-linear-\\S+|bg-radial\\S*|bg-conic\\S*)(?![\\w-])`,
            "g",
        ),
    },
    {
        category: "font size outside the tokens",
        pattern: new RegExp(
            `${classStart}text-(?:xs|sm|base|lg|xl|[2-9]xl)(?![\\w-])`,
            "g",
        ),
    },
];

function proseLines(source: string): string[] {
    let skipping = false;
    return source.split("\n").map((text) => {
        const fence = text.match(/^\s*```(.*)$/);
        if (fence) {
            if (skipping) {
                skipping = false;
            } else if (/\bbad\b/.test(fence[1])) {
                skipping = true;
            }
            return "";
        }
        return skipping
            ? ""
            : text.replace(/`[^`]*`/g, (span) => " ".repeat(span.length));
    });
}

export function findViolations(source: string, file: string): Violation[] {
    const violations: Violation[] = [];
    const lines = file.endsWith(".mdx")
        ? proseLines(source)
        : source.split("\n");
    lines.forEach((text, index) => {
        for (const { category, pattern } of rules) {
            for (const match of text.matchAll(pattern)) {
                violations.push({
                    file,
                    line: index + 1,
                    column: (match.index ?? 0) + 1,
                    category,
                    match: match[0],
                });
            }
        }
    });
    return violations;
}

export const ignoredPaths = [
    /(^|\/)node_modules\//,
    /(^|\/)storybook-static\//,
    /(^|\/)src\/tokens\/(raw|semantic|component|theme|accents)\.css$/,
    /\.test\.(ts|tsx)$/,
    /(^|\/)scripts\//,
];

export const scannedExtensions = /\.(ts|tsx|js|jsx|mjs|css|mdx|html)$/;
