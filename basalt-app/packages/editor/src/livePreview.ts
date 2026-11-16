import { syntaxTree } from "@codemirror/language";
import {
    type EditorState,
    type Extension,
    type Range,
} from "@codemirror/state";
import {
    Decoration,
    type DecorationSet,
    EditorView,
    ViewPlugin,
    type ViewUpdate,
} from "@codemirror/view";

export type TextRange = { from: number; to: number };

const hidden = Decoration.replace({});
const headingLine = [1, 2, 3, 4, 5, 6].map((level) =>
    Decoration.line({ class: `cm-lp-h cm-lp-h${level}` }),
);
const quoteLine = Decoration.line({ class: "cm-lp-quote" });
const codeLine = Decoration.line({ class: "cm-lp-codeblock" });
const strongMark = Decoration.mark({ class: "cm-lp-strong" });
const emphasisMark = Decoration.mark({ class: "cm-lp-em" });
const inlineCodeMark = Decoration.mark({ class: "cm-lp-code" });
const linkMark = Decoration.mark({ class: "cm-lp-link" });
const linkUrlMark = Decoration.mark({ class: "cm-lp-link-url" });
const listMark = Decoration.mark({ class: "cm-lp-list-mark" });
const quoteMark = Decoration.mark({ class: "cm-lp-quote-mark" });
const taskMark = Decoration.mark({ class: "cm-lp-task" });
const taskDoneMark = Decoration.mark({ class: "cm-lp-task cm-lp-task-done" });

export function activeLineNumbers(state: EditorState): Set<number> {
    const lines = new Set<number>();
    for (const range of state.selection.ranges) {
        const first = state.doc.lineAt(range.from).number;
        const last = state.doc.lineAt(range.to).number;
        for (let line = first; line <= last; line++) lines.add(line);
    }
    return lines;
}

function headingLevel(name: string): number {
    const match = /^(?:ATX|Setext)Heading([1-6])$/.exec(name);
    return match ? Number(match[1]) : 0;
}

function addLineDecorations(
    state: EditorState,
    from: number,
    to: number,
    decoration: Decoration,
    out: Range<Decoration>[],
) {
    const first = state.doc.lineAt(from).number;
    const last = state.doc.lineAt(Math.max(from, to - 1)).number;
    for (let number = first; number <= last; number++) {
        out.push(decoration.range(state.doc.line(number).from));
    }
}

export function buildLivePreviewDecorations(
    state: EditorState,
    ranges: readonly TextRange[],
): DecorationSet {
    const active = activeLineNumbers(state);
    const isActive = (position: number) =>
        active.has(state.doc.lineAt(position).number);
    const out: Range<Decoration>[] = [];

    for (const { from, to } of ranges) {
        syntaxTree(state).iterate({
            from,
            to,
            enter: (node) => {
                const name = node.name;
                const level = headingLevel(name);
                if (level > 0) {
                    out.push(
                        headingLine[level - 1].range(
                            state.doc.lineAt(node.from).from,
                        ),
                    );
                    return;
                }
                switch (name) {
                    case "HeaderMark": {
                        if (node.node.parent?.name.startsWith("ATX") !== true)
                            return;
                        if (isActive(node.from)) return;
                        const next = state.doc.sliceString(
                            node.to,
                            node.to + 1,
                        );
                        const end = next === " " ? node.to + 1 : node.to;
                        out.push(hidden.range(node.from, end));
                        return;
                    }
                    case "StrongEmphasis":
                        out.push(strongMark.range(node.from, node.to));
                        return;
                    case "Emphasis":
                        out.push(emphasisMark.range(node.from, node.to));
                        return;
                    case "InlineCode":
                        out.push(inlineCodeMark.range(node.from, node.to));
                        return;
                    case "EmphasisMark":
                        if (!isActive(node.from))
                            out.push(hidden.range(node.from, node.to));
                        return;
                    case "CodeMark":
                        if (
                            node.node.parent?.name === "InlineCode" &&
                            !isActive(node.from)
                        )
                            out.push(hidden.range(node.from, node.to));
                        return;
                    case "Link":
                        out.push(linkMark.range(node.from, node.to));
                        return;
                    case "URL":
                        if (node.node.parent?.name === "Link")
                            out.push(linkUrlMark.range(node.from, node.to));
                        return;
                    case "ListMark":
                        out.push(listMark.range(node.from, node.to));
                        return;
                    case "TaskMarker": {
                        const done = /\[[xX]\]/.test(
                            state.doc.sliceString(node.from, node.to),
                        );
                        out.push(
                            (done ? taskDoneMark : taskMark).range(
                                node.from,
                                node.to,
                            ),
                        );
                        return;
                    }
                    case "Blockquote":
                        addLineDecorations(
                            state,
                            node.from,
                            node.to,
                            quoteLine,
                            out,
                        );
                        return;
                    case "QuoteMark":
                        out.push(quoteMark.range(node.from, node.to));
                        return;
                    case "FencedCode":
                    case "CodeBlock":
                        addLineDecorations(
                            state,
                            node.from,
                            node.to,
                            codeLine,
                            out,
                        );
                        return;
                }
            },
        });
    }
    return Decoration.set(out, true);
}

const livePreviewPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = buildLivePreviewDecorations(
                view.state,
                view.visibleRanges,
            );
        }

        update(update: ViewUpdate) {
            if (
                update.docChanged ||
                update.selectionSet ||
                update.viewportChanged ||
                syntaxTree(update.state) !== syntaxTree(update.startState)
            ) {
                this.decorations = buildLivePreviewDecorations(
                    update.state,
                    update.view.visibleRanges,
                );
            }
        }
    },
    { decorations: (plugin) => plugin.decorations },
);

const livePreviewTheme = EditorView.theme({
    ".cm-lp-h": { fontWeight: "600" },
    ".cm-lp-h1": {
        fontSize: "var(--bs-text-size-note-h1)",
        lineHeight: "var(--bs-text-size-note-h1-line-height)",
    },
    ".cm-lp-h2": {
        fontSize: "var(--bs-text-size-note-h2)",
        lineHeight: "var(--bs-text-size-note-h2-line-height)",
    },
    ".cm-lp-h3, .cm-lp-h4, .cm-lp-h5, .cm-lp-h6": {
        fontSize: "var(--bs-text-size-note-h3)",
        lineHeight: "var(--bs-text-size-note-h3-line-height)",
    },
    ".cm-lp-strong": { fontWeight: "700" },
    ".cm-lp-em": { fontStyle: "italic" },
    ".cm-lp-code": {
        fontFamily: "var(--bs-font-code)",
        fontSize: "var(--bs-text-size-code)",
        backgroundColor: "var(--bs-code-block-bg)",
    },
    ".cm-lp-link": { color: "var(--bs-text-link)" },
    ".cm-lp-link-url": { color: "var(--bs-text-muted)" },
    ".cm-lp-list-mark, .cm-lp-quote-mark, .cm-lp-task": {
        color: "var(--bs-text-muted)",
    },
    ".cm-lp-task-done": { color: "var(--bs-text-link)" },
    ".cm-lp-quote": {
        borderLeft: "2px solid var(--bs-border-control)",
        paddingLeft: "var(--raw-space-2)",
        color: "var(--bs-text-muted)",
    },
    ".cm-lp-codeblock": {
        fontFamily: "var(--bs-font-code)",
        fontSize: "var(--bs-text-size-code)",
        lineHeight: "var(--bs-text-size-code-line-height)",
        backgroundColor: "var(--bs-code-block-bg)",
    },
});

export const livePreview: Extension = [livePreviewPlugin, livePreviewTheme];
