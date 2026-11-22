import { EditorSelection, EditorState } from "@codemirror/state";
import { history, redo, undo } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMarkdownEditor } from "./createMarkdownEditor";
import {
    computeEmphasisToggle,
    emphasisKeymap,
    toggleBold,
    toggleItalic,
    type EmphasisMarker,
} from "./formatting";

function apply(
    text: string,
    from: number,
    to: number,
    marker: EmphasisMarker,
): { text: string; from: number; to: number } | null {
    const edit = computeEmphasisToggle(text, { from, to }, marker);
    if (!edit) return null;
    const state = EditorState.create({ doc: text });
    const next = state.update({ changes: [...edit.changes] }).state.doc;
    return { text: next.toString(), from: edit.range.from, to: edit.range.to };
}

describe("computeEmphasisToggle", () => {
    it("wraps a selection and keeps it on the original text", () => {
        expect(apply("a text b", 2, 6, "**")).toEqual({
            text: "a **text** b",
            from: 4,
            to: 8,
        });
        expect(apply("a text b", 2, 6, "*")).toEqual({
            text: "a *text* b",
            from: 3,
            to: 7,
        });
    });

    it("unwraps when the markers surround the selection", () => {
        expect(apply("a **text** b", 4, 8, "**")).toEqual({
            text: "a text b",
            from: 2,
            to: 6,
        });
        expect(apply("a *text* b", 3, 7, "*")).toEqual({
            text: "a text b",
            from: 2,
            to: 6,
        });
    });

    it("unwraps when the selection includes its markers and keeps the inner text selected", () => {
        expect(apply("a **text** b", 2, 10, "**")).toEqual({
            text: "a text b",
            from: 2,
            to: 6,
        });
        expect(apply("*x*", 0, 3, "*")).toEqual({ text: "x", from: 0, to: 1 });
    });

    it("inserts the empty pair at a cursor with the cursor between", () => {
        expect(apply("ab", 1, 1, "**")).toEqual({
            text: "a****b",
            from: 3,
            to: 3,
        });
        expect(apply("", 0, 0, "*")).toEqual({ text: "**", from: 1, to: 1 });
    });

    it("removes the empty pair when the cursor is between it", () => {
        expect(apply("a****b", 3, 3, "**")).toEqual({
            text: "ab",
            from: 1,
            to: 1,
        });
        expect(apply("a**b", 2, 2, "*")).toEqual({
            text: "ab",
            from: 1,
            to: 1,
        });
    });

    it("returns null for a whitespace-only selection", () => {
        expect(apply("a   b", 1, 4, "**")).toBeNull();
        expect(apply("a\n\nb", 1, 3, "*")).toBeNull();
    });

    it("wraps leading and trailing whitespace exactly as selected", () => {
        expect(apply("a text b", 1, 7, "**")?.text).toBe("a** text **b");
    });

    it("treats ***text*** as bold plus italic for both markers", () => {
        expect(apply("***t***", 3, 4, "**")?.text).toBe("*t*");
        expect(apply("***t***", 3, 4, "*")?.text).toBe("**t**");
    });

    it("adds the other style to existing emphasis", () => {
        expect(apply("*t*", 1, 2, "**")?.text).toBe("***t***");
        expect(apply("**t**", 2, 3, "*")?.text).toBe("***t***");
    });

    it("does not count escaped asterisks as markers", () => {
        expect(apply("\\*t\\*", 2, 3, "*")?.text).toBe("\\**t*\\*");
        expect(apply("\\**t**", 3, 4, "*")?.text).not.toBe("t");
    });

    it("unwraps emphasis after an escaped backslash", () => {
        const backslashes = "\\".repeat(2);
        expect(apply(backslashes + "**t**", 4, 5, "**")?.text).toBe(
            backslashes + "t",
        );
    });

    it("wraps when markers exist on one side only", () => {
        expect(apply("**t", 2, 3, "**")?.text).toBe("****t**");
        expect(apply("t**", 0, 1, "**")?.text).toBe("**t****");
    });

    it("does not detect underscore emphasis", () => {
        expect(apply("__t__", 2, 3, "**")?.text).toBe("__**t**__");
    });

    it("does not unwrap a selection made only of asterisks", () => {
        expect(apply("****", 0, 4, "**")?.text).toBe("******** ".trim());
    });

    it("wraps a selection spanning lines", () => {
        expect(apply("a\nb", 0, 3, "**")?.text).toBe("**a\nb**");
    });

    it("clamps out-of-range positions without throwing", () => {
        expect(() =>
            computeEmphasisToggle("ab", { from: 5, to: 9 }, "*"),
        ).not.toThrow();
    });
});

describe("emphasis commands in the editor", () => {
    let parent: HTMLElement;

    beforeEach(() => {
        parent = document.createElement("div");
        document.body.appendChild(parent);
    });

    afterEach(() => parent.remove());

    function setup(doc: string, readOnly = false) {
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, {
            doc,
            onChange,
            readOnly,
        });
        const view = EditorView.findFromDOM(parent) as EditorView;
        return { editor, view, onChange };
    }

    function press(
        view: EditorView,
        key: string,
        extra: KeyboardEventInit = {},
    ) {
        const event = new KeyboardEvent("keydown", {
            key,
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
            ...extra,
        });
        view.contentDOM.dispatchEvent(event);
        return event;
    }

    it("Ctrl+B wraps the selection and a second press unwraps it", () => {
        const { editor, view } = setup("a text b");
        view.dispatch({ selection: { anchor: 2, head: 6 } });
        press(view, "b");
        expect(editor.getText()).toBe("a **text** b");
        press(view, "b");
        expect(editor.getText()).toBe("a text b");
        expect(
            view.state.sliceDoc(
                view.state.selection.main.from,
                view.state.selection.main.to,
            ),
        ).toBe("text");
    });

    it("Ctrl+I inserts the pair with the cursor between and does not select the parent syntax", () => {
        const { editor, view } = setup("# Title\n");
        view.dispatch({ selection: { anchor: 8 } });
        press(view, "i");
        expect(editor.getText()).toBe("# Title\n**");
        expect(view.state.selection.main.head).toBe(9);
        press(view, "i");
        expect(editor.getText()).toBe("# Title\n");
    });

    it("a whitespace-only selection changes nothing and does not select the parent syntax", () => {
        const { editor, view, onChange } = setup("a   b");
        view.dispatch({ selection: { anchor: 1, head: 4 } });
        press(view, "i");
        expect(editor.getText()).toBe("a   b");
        expect(view.state.selection.main.from).toBe(1);
        expect(view.state.selection.main.to).toBe(4);
        expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
        ["Shift", { shiftKey: true }],
        ["Alt", { altKey: true }],
        ["no modifier", { ctrlKey: false }],
    ])("does not bind %s combinations", (_, extra) => {
        const { editor, view } = setup("text");
        view.dispatch({ selection: { anchor: 0, head: 4 } });
        press(view, "shiftKey" in extra ? "B" : "b", extra);
        expect(editor.getText()).toBe("text");
    });

    it("does nothing while composing", () => {
        const { editor, view } = setup("text");
        view.dispatch({ selection: { anchor: 0, head: 4 } });
        view.contentDOM.dispatchEvent(new CompositionEvent("compositionstart"));
        expect(toggleBold(view)).toBe(true);
        expect(editor.getText()).toBe("text");
        view.contentDOM.dispatchEvent(new CompositionEvent("compositionend"));
    });

    it("does nothing in a read-only editor", () => {
        const { editor, view } = setup("text", true);
        view.dispatch({ selection: { anchor: 0, head: 4 } });
        expect(toggleBold(view)).toBe(false);
        expect(editor.getText()).toBe("text");
    });

    it("is one undo step, never merges with typing, and redo reapplies it", () => {
        const view = new EditorView({
            parent,
            state: EditorState.create({
                doc: "",
                extensions: [history()],
            }),
        });
        view.dispatch({
            changes: { from: 0, insert: "word" },
            selection: { anchor: 0, head: 4 },
            userEvent: "input.type",
        });
        toggleBold(view);
        expect(view.state.doc.toString()).toBe("**word**");
        undo(view);
        expect(view.state.doc.toString()).toBe("word");
        expect(view.state.selection.main.from).toBe(0);
        expect(view.state.selection.main.to).toBe(4);
        redo(view);
        expect(view.state.doc.toString()).toBe("**word**");
        undo(view);
        undo(view);
        expect(view.state.doc.toString()).toBe("");
        view.destroy();
    });

    it("toggles every selection in one transaction, undone in one step", () => {
        const view = new EditorView({
            parent,
            state: EditorState.create({
                doc: "aa bb cc",
                selection: EditorSelection.create([
                    EditorSelection.range(0, 2),
                    EditorSelection.range(6, 8),
                ]),
                extensions: [
                    history(),
                    EditorState.allowMultipleSelections.of(true),
                ],
            }),
        });
        toggleBold(view);
        expect(view.state.doc.toString()).toBe("**aa** bb **cc**");
        expect(view.state.selection.ranges.map((r) => [r.from, r.to])).toEqual([
            [2, 4],
            [12, 14],
        ]);
        undo(view);
        expect(view.state.doc.toString()).toBe("aa bb cc");
        view.destroy();
    });

    it("toggles only the main range when two ranges' markers would overlap", () => {
        const view = new EditorView({
            parent,
            state: EditorState.create({
                doc: "aabb",
                selection: EditorSelection.create(
                    [EditorSelection.range(0, 2), EditorSelection.range(2, 4)],
                    1,
                ),
                extensions: [EditorState.allowMultipleSelections.of(true)],
            }),
        });
        toggleBold(view);
        expect(view.state.doc.toString()).toBe("aa**bb**");
        view.destroy();
    });

    it("binds Mod-b and Mod-i ahead of the default keymap", () => {
        expect(emphasisKeymap.map((b) => b.key)).toEqual(["Mod-b", "Mod-i"]);
        expect(emphasisKeymap[1].run).toBe(toggleItalic);
    });
});
