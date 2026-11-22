import { GFM, parser } from "@lezer/markdown";

const markdown = parser.configure(GFM);
const STRIPPED_NODES = new Set([
    "HeaderMark",
    "EmphasisMark",
    "CodeMark",
    "LinkMark",
    "URL",
    "LinkTitle",
    "LinkLabel",
]);

export interface NoteHeading {
    readonly text: string;
    readonly line: { readonly from: number; readonly to: number };
    readonly content: { readonly from: number; readonly to: number };
}

interface Removal {
    readonly from: number;
    readonly to: number;
}

function lineEnd(text: string, from: number): number {
    const newline = text.indexOf("\n", from);
    const end = newline === -1 ? text.length : newline;
    return end > from && text[end - 1] === "\r" ? end - 1 : end;
}

function plainText(
    text: string,
    tree: ReturnType<typeof markdown.parse>,
    from: number,
    to: number,
): string {
    const removals: Removal[] = [];
    tree.iterate({
        from,
        to,
        enter(node) {
            if (node.name === "Image") {
                removals.push({ from: node.from, to: node.to });
                return false;
            }
            if (STRIPPED_NODES.has(node.name)) {
                removals.push({ from: node.from, to: node.to });
            } else if (node.name === "Escape") {
                removals.push({ from: node.from, to: node.from + 1 });
            }
            return undefined;
        },
    });
    let result = "";
    let position = from;
    for (const removal of removals.sort((a, b) => a.from - b.from)) {
        if (removal.from > position) {
            result += text.slice(position, removal.from);
        }
        position = Math.max(position, removal.to);
    }
    return result + text.slice(position, to);
}

const CANDIDATE = /^ {0,3}#(?=[ \t]|$)/gm;
const MAX_CANDIDATES = 50;

function headingIn(
    text: string,
    tree: ReturnType<typeof markdown.parse>,
    candidate: number,
): NoteHeading | null {
    for (
        let child = tree.topNode.firstChild;
        child;
        child = child.nextSibling
    ) {
        if (child.name !== "ATXHeading1") continue;
        if (child.from < candidate) continue;
        const lineTo = lineEnd(text, child.from);
        let contentFrom = child.from + 1;
        while (contentFrom < lineTo && text[contentFrom] === " ") {
            contentFrom += 1;
        }
        return {
            text: plainText(text, tree, child.from, lineTo).trim(),
            line: { from: child.from, to: lineTo },
            content: { from: Math.min(contentFrom, lineTo), to: lineTo },
        };
    }
    return null;
}

export function firstHeading(text: string): NoteHeading | null {
    CANDIDATE.lastIndex = 0;
    let checked = 0;
    for (
        let match = CANDIDATE.exec(text);
        match;
        match = CANDIDATE.exec(text)
    ) {
        if (checked === MAX_CANDIDATES) {
            return headingIn(text, markdown.parse(text), match.index);
        }
        checked += 1;
        const end = lineEnd(text, match.index);
        const found = headingIn(
            text.slice(0, end),
            markdown.parse(text.slice(0, end)),
            match.index,
        );
        if (found) return found;
    }
    return null;
}

export function setFirstHeading(text: string, title: string): string {
    const heading = firstHeading(text);
    if (heading) {
        const spaced = text[heading.content.from - 1] === "#" ? " " : "";
        return (
            text.slice(0, heading.content.from) +
            spaced +
            title +
            text.slice(heading.content.to)
        );
    }
    if (text === "") return `# ${title}`;
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    return `# ${title}${eol}${eol}${text}`;
}
