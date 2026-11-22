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

    it("hides inline code backticks and the fence markers of a fenced block", () => {
        const doc = "x\n`a`\n```\ncode\n```";
        expect(hiddenOf(decorations(doc, 0))).toEqual([
            [2, 3],
            [4, 5],
            [6, 9],
            [15, 18],
        ]);
    });

    it("styles emphasis, strong and inline code", () => {
        const list = classesOf(decorations("*a* **b** `c`", 99));
        expect(list).toEqual(
            expect.arrayContaining(["cm-lp-em", "cm-lp-strong", "cm-lp-code"]),
        );
    });

    it("hides only the fence markers of a code block that looks like emphasis", () => {
        expect(hiddenOf(decorations("x\n```\n*a*\n```", 0))).toEqual([
            [2, 5],
            [10, 13],
        ]);
    });
});

describe("fenced code", () => {
    const fenced = "x\n```js\ncode\n```\ny";

    it("hides the opening marker with its info string and the closing marker", () => {
        expect(hiddenOf(decorations(fenced, 0))).toEqual([
            [2, 7],
            [13, 16],
        ]);
    });

    it("hides the space between the marker and the info string", () => {
        expect(hiddenOf(decorations("x\n``` js\ncode\n```", 0))).toEqual([
            [2, 8],
            [14, 17],
        ]);
    });

    it("shows the opening fence source on its line and keeps the closing one hidden", () => {
        expect(hiddenOf(decorations(fenced, 4))).toEqual([[13, 16]]);
    });

    it("shows the closing fence source on its line and keeps the opening one hidden", () => {
        expect(hiddenOf(decorations(fenced, 14))).toEqual([[2, 7]]);
    });

    it("keeps both fences hidden with the cursor on a code line", () => {
        expect(hiddenOf(decorations(fenced, 9))).toEqual([
            [2, 7],
            [13, 16],
        ]);
    });

    it("shows every fence line a selection touches", () => {
        expect(hiddenOf(decorations(fenced, 0, 14))).toEqual([]);
    });

    it("hides a tilde fence", () => {
        expect(hiddenOf(decorations("x\n~~~\ncode\n~~~", 0))).toEqual([
            [2, 5],
            [11, 14],
        ]);
    });

    it("hides only the opening marker of an unclosed fence and keeps the content", () => {
        const doc = "x\n```\ncode";
        expect(hiddenOf(decorations(doc, 0))).toEqual([[2, 5]]);
        expect(hiddenOf(decorations(doc, 3))).toEqual([]);
    });

    it("hides a closing fence longer than the opening one", () => {
        expect(hiddenOf(decorations("x\n```\ncode\n`````", 0))).toEqual([
            [2, 5],
            [11, 16],
        ]);
    });

    it("does not hide a closing fence shorter than the opening one", () => {
        const doc = "x\n````\ncode\n```";
        expect(hiddenOf(decorations(doc, 0))).toEqual([[2, 6]]);
    });

    it("hides both fences of an empty fenced block", () => {
        expect(hiddenOf(decorations("x\n```\n```", 0))).toEqual([
            [2, 5],
            [6, 9],
        ]);
    });

    it("keeps the quote marker of a fence inside a blockquote visible", () => {
        expect(hiddenOf(decorations("x\n> ```\n> code\n> ```", 0))).toEqual([
            [4, 7],
            [17, 20],
        ]);
    });

    it("keeps the list marker of a fence inside a list item visible", () => {
        expect(hiddenOf(decorations("x\n- ```\n  code\n  ```", 0))).toEqual([
            [4, 7],
            [17, 20],
        ]);
    });

    it("keeps styling every line of the block", () => {
        expect(classesOf(decorations(fenced, 0))).toEqual(
            Array(3).fill("cm-lp-codeblock"),
        );
    });

    it("hides nothing for an indented code block", () => {
        expect(hiddenOf(decorations("x\n\n    code", 0))).toEqual([]);
    });
});

describe("backslash escapes", () => {
    it.each([
        ["asterisk", "x\n\\*a\\*"],
        ["hash", "x\n\\# a"],
        ["bracket", "x\n\\[a]"],
        ["backtick", "x\n\\`a"],
    ])("hides the backslash of an escaped %s off the active line", (_, doc) => {
        expect(hiddenOf(decorations(doc, 0))[0]).toEqual([2, 3]);
    });

    it("hides the first backslash of an escaped backslash only", () => {
        expect(hiddenOf(decorations("x\n\\\\a", 0))).toEqual([[2, 3]]);
    });

    it("shows the source on the active line", () => {
        expect(hiddenOf(decorations("x\n\\*a\\*", 4))).toEqual([]);
    });

    it("shows the source for every line a selection touches", () => {
        expect(hiddenOf(decorations("\\*a\n\\*b\n\\*c", 0, 5))).toEqual([
            [8, 9],
        ]);
    });

    it("does not hide a backslash before a non-escapable character", () => {
        expect(hiddenOf(decorations("x\n\\a", 0))).toEqual([]);
    });

    it("does not hide a trailing backslash", () => {
        expect(hiddenOf(decorations("x\na\\\nb", 0))).toEqual([]);
    });

    it("does not hide a backslash inside an inline code span", () => {
        expect(hiddenOf(decorations("x\n`a\\*b`", 0))).toEqual([
            [2, 3],
            [7, 8],
        ]);
    });

    it("does not hide a backslash inside a fenced block", () => {
        expect(hiddenOf(decorations("x\n```\n\\*a\n```", 0))).toEqual([
            [2, 5],
            [10, 13],
        ]);
    });

    it("renders an escape and inline code on one line together", () => {
        expect(hiddenOf(decorations("x\n\\*a `b`", 0))).toEqual([
            [2, 3],
            [6, 7],
            [8, 9],
        ]);
    });

    it("hides an escape at the start of the document", () => {
        expect(hiddenOf(decorations("\\*a\nb", 5))).toEqual([[0, 1]]);
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

    it("hides fence lines off the active line, shows them on it and keeps the source", () => {
        const source = "x\n```js\n\nTest\n```\ny";
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, { doc: source, onChange });
        const view = viewOf();
        const lines = () =>
            [...parent.querySelectorAll(".cm-line")].map((l) => l.textContent);

        view.dispatch({ selection: { anchor: 0 } });
        expect(lines()).toEqual(["x", "", "", "Test", "", "y"]);

        view.dispatch({ selection: { anchor: 4 } });
        expect(lines()).toEqual(["x", "```js", "", "Test", "", "y"]);

        view.dispatch({ selection: { anchor: source.indexOf("```\ny") } });
        expect(lines()).toEqual(["x", "", "", "Test", "```", "y"]);

        expect(editor.getText()).toBe(source);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("renders an escaped character literally off the active line and keeps the backslash", () => {
        const source = "\\*literal\\* and \\`tick\nnext";
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, { doc: source, onChange });
        const view = viewOf();
        const firstLine = () => parent.querySelector(".cm-line")?.textContent;

        view.dispatch({ selection: { anchor: 0 } });
        expect(firstLine()).toBe(source.split("\n")[0]);

        view.dispatch({ selection: { anchor: source.length } });
        expect(firstLine()).toBe("*literal* and `tick");

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
