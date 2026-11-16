import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMarkdownEditor } from "./createMarkdownEditor";
import { activeLineNumbers, buildLivePreviewDecorations } from "./livePreview";

type Deco = { from: number; to: number; cls: string | null; hide: boolean };

function stateOf(doc: string, anchor = 0, head = anchor): EditorState {
    const state = EditorState.create({
        doc,
        selection: {
            anchor: Math.min(anchor, doc.length),
            head: Math.min(head, doc.length),
        },
        extensions: [markdown({ base: markdownLanguage })],
    });
    ensureSyntaxTree(state, doc.length, 5000);
    return state;
}

function decorations(doc: string, anchor = 0, head = anchor): Deco[] {
    const state = stateOf(doc, anchor, head);
    const set = buildLivePreviewDecorations(state, [
        { from: 0, to: doc.length },
    ]);
    const out: Deco[] = [];
    const cursor = set.iter();
    while (cursor.value) {
        const spec = cursor.value.spec as { class?: string };
        out.push({
            from: cursor.from,
            to: cursor.to,
            cls: spec.class ?? null,
            hide: !spec.class,
        });
        cursor.next();
    }
    return out;
}

const hiddenOf = (list: Deco[]) =>
    list.filter((d) => d.hide).map((d) => [d.from, d.to]);
const classesOf = (list: Deco[]) => list.map((d) => d.cls).filter(Boolean);

describe("activeLineNumbers", () => {
    it("is the cursor line", () => {
        expect([...activeLineNumbers(stateOf("a\nb\nc", 2))]).toEqual([2]);
    });

    it("covers every line a selection touches", () => {
        expect([...activeLineNumbers(stateOf("a\nb\nc\nd", 1, 5))]).toEqual([
            1, 2, 3,
        ]);
    });
});

describe("heading markers", () => {
    it("hides the marker and its space off the cursor line", () => {
        const doc = "text\n## Title";
        expect(hiddenOf(decorations(doc, 0))).toEqual([[5, 8]]);
    });

    it("shows the source on the cursor line", () => {
        expect(hiddenOf(decorations("text\n## Title", 8))).toEqual([]);
    });

    it("styles headings by level on every line", () => {
        const list = decorations("# a\n## b\n###### c", 0);
        expect(classesOf(list).filter((c) => c?.includes("cm-lp-h "))).toEqual([
            "cm-lp-h cm-lp-h1",
            "cm-lp-h cm-lp-h2",
            "cm-lp-h cm-lp-h6",
        ]);
    });

    it("keeps a non-heading hash visible", () => {
        expect(hiddenOf(decorations("a\n#nospace", 0))).toEqual([]);
    });

    it("keeps the source when a selection spans the heading line", () => {
        expect(hiddenOf(decorations("# a\nb", 0, 5))).toEqual([]);
    });
});

describe("inline markers", () => {
    it("hides emphasis and strong markers off the cursor line", () => {
        const doc = "x\n*a* and **b**";
        expect(hiddenOf(decorations(doc, 0))).toEqual([
            [2, 3],
            [4, 5],
            [10, 12],
            [13, 15],
        ]);
    });

    it("shows emphasis markers on the cursor line", () => {
        expect(hiddenOf(decorations("x\n*a* and **b**", 4))).toEqual([]);
    });

    it("hides inline code backticks but not fenced code fences", () => {
        const doc = "x\n`a`\n```\ncode\n```";
        expect(hiddenOf(decorations(doc, 0))).toEqual([
            [2, 3],
            [4, 5],
        ]);
    });

    it("styles emphasis, strong and inline code", () => {
        const list = classesOf(decorations("*a* **b** `c`", 99));
        expect(list).toEqual(
            expect.arrayContaining(["cm-lp-em", "cm-lp-strong", "cm-lp-code"]),
        );
    });

    it("hides nothing inside a code block that looks like emphasis", () => {
        expect(hiddenOf(decorations("x\n```\n*a*\n```", 0))).toEqual([]);
    });
});

describe("block styling", () => {
    it("styles links, list and task markers", () => {
        const list = classesOf(
            decorations("- [ ] todo\n- [x] done\n[t](u)", 99),
        );
        expect(list).toEqual(
            expect.arrayContaining([
                "cm-lp-list-mark",
                "cm-lp-task",
                "cm-lp-task cm-lp-task-done",
                "cm-lp-link",
                "cm-lp-link-url",
            ]),
        );
    });

    it("never hides list, quote or link syntax", () => {
        expect(hiddenOf(decorations("x\n- a\n> q\n[t](u)\n1. n", 0))).toEqual(
            [],
        );
    });

    it("styles each line of a blockquote and a fenced block", () => {
        const list = classesOf(decorations("> a\n> b\n\n```\nc\n```", 99));
        expect(list.filter((c) => c === "cm-lp-quote")).toHaveLength(2);
        expect(list.filter((c) => c === "cm-lp-codeblock")).toHaveLength(3);
    });
});

describe("in the editor", () => {
    let parent: HTMLElement;

    beforeEach(() => {
        parent = document.createElement("div");
        document.body.appendChild(parent);
    });

    afterEach(() => parent.remove());

    function viewOf(): EditorView {
        const view = EditorView.findFromDOM(parent);
        if (!view) throw new Error("no editor view");
        return view;
    }

    it("renders a line once the cursor leaves it and shows source under it", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "## Title\nbody",
            onChange: vi.fn(),
        });
        const view = viewOf();
        const firstLine = () => parent.querySelector(".cm-line")?.textContent;

        view.dispatch({ selection: { anchor: 3 } });
        expect(firstLine()).toBe("## Title");

        view.dispatch({ selection: { anchor: 10 } });
        expect(firstLine()).toBe("Title");
        expect(parent.querySelector(".cm-lp-h2")).not.toBeNull();
        expect(editor.getText()).toBe("## Title\nbody");
    });

    it("never changes the document when rendering", () => {
        const source = "# a\n*b* **c** `d`\n- e\n> f\n```\ng\n```\n";
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, {
            doc: source,
            onChange,
        });
        viewOf().dispatch({ selection: { anchor: source.length } });
        expect(editor.getText()).toBe(source);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("renders typed Markdown when Enter moves the cursor away", () => {
        createMarkdownEditor(parent, { doc: "", onChange: vi.fn() });
        const view = viewOf();
        view.dispatch({ changes: { from: 0, insert: "**bold**\n" } });
        view.dispatch({ selection: { anchor: view.state.doc.length } });
        expect(parent.querySelector(".cm-line")?.textContent).toBe("bold");
        expect(parent.querySelector(".cm-lp-strong")).not.toBeNull();
    });

    it("keeps rendering after setText with the cursor kept", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "plain",
            onChange: vi.fn(),
        });
        editor.setText("plain\n# Head");
        expect(parent.querySelectorAll(".cm-line")[1]?.textContent).toBe(
            "Head",
        );
        expect(parent.querySelector(".cm-lp-h1")).not.toBeNull();
    });

    it("keeps Obsidian-style list continuation, saved text equals the editor text", () => {
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, { doc: "", onChange });
        const view = viewOf();
        view.dispatch({ changes: { from: 0, insert: "- one" } });
        view.dispatch({ selection: { anchor: 5 } });
        const text = editor.getText();
        expect(text).toBe("- one");
        expect(onChange).toHaveBeenLastCalledWith(text);
    });
});
