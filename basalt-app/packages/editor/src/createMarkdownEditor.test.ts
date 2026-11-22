import { EditorView } from "@codemirror/view";
import { undo } from "@codemirror/commands";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMarkdownEditor } from "./createMarkdownEditor";

let parent: HTMLElement;

beforeEach(() => {
    const emptyRects = () =>
        Object.assign([], { item: () => null }) as unknown as DOMRectList;
    Range.prototype.getClientRects = emptyRects;
    Range.prototype.getBoundingClientRect = () => new DOMRect();
    parent = document.createElement("div");
    document.body.appendChild(parent);
});

afterEach(() => {
    parent.remove();
});

function viewOf(): EditorView {
    const view = EditorView.findFromDOM(parent);
    if (!view) throw new Error("no editor view");
    return view;
}

describe("editor scroller", () => {
    it("is the editor's only scroller and uses the scrollbar tokens", () => {
        createMarkdownEditor(parent, { doc: "x", onChange: vi.fn() });
        const css = [...document.querySelectorAll("style")]
            .map((style) => style.textContent ?? "")
            .join("\n");
        const rule = /\.cm-scroller\s*\{[^}]*\}/g;
        const scroller = (css.match(rule) ?? []).join(" ");
        expect(scroller).toContain("overflow: auto");
        expect(scroller).toContain("scrollbar-width: thin");
        expect(scroller).toContain("var(--bs-scrollbar-thumb)");
        expect(scroller).toContain("var(--bs-scrollbar-track)");
    });
});

describe("createMarkdownEditor", () => {
    it("returns the exact Markdown source", () => {
        const source = "# Title\n\n- a\n- b  \n\n\tcode\n";
        const editor = createMarkdownEditor(parent, {
            doc: source,
            onChange: vi.fn(),
        });
        expect(editor.getText()).toBe(source);
    });

    it("reports the new text on edits", () => {
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, { doc: "abc", onChange });
        viewOf().dispatch({ changes: { from: 3, insert: "d" } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith("abcd");
        expect(editor.getText()).toBe("abcd");
    });

    it("does not report selection-only changes", () => {
        const onChange = vi.fn();
        createMarkdownEditor(parent, { doc: "abc", onChange });
        viewOf().dispatch({ selection: { anchor: 1 } });
        expect(onChange).not.toHaveBeenCalled();
    });

    it("setText replaces the document without echoing onChange", () => {
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, { doc: "old", onChange });
        editor.setText("new text");
        expect(editor.getText()).toBe("new text");
        expect(onChange).not.toHaveBeenCalled();
        viewOf().dispatch({ changes: { from: 8, insert: "!" } });
        expect(onChange).toHaveBeenLastCalledWith("new text!");
    });

    it("setText resets undo history so a reload cannot be undone", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "a",
            onChange: vi.fn(),
        });
        viewOf().dispatch({ changes: { from: 1, insert: "b" } });
        editor.setText("from disk");
        expect(undo(viewOf())).toBe(false);
        expect(editor.getText()).toBe("from disk");
    });

    it("setText keeps the selection within the new document", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "long document",
            onChange: vi.fn(),
        });
        viewOf().dispatch({ selection: { anchor: 13 } });
        editor.setText("short");
        expect(viewOf().state.selection.main.head).toBe(5);
    });

    it("composes custom extensions", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "x",
            onChange: vi.fn(),
            extensions: [
                EditorView.contentAttributes.of({ "data-custom": "yes" }),
            ],
        });
        expect(
            parent.querySelector(".cm-content")?.getAttribute("data-custom"),
        ).toBe("yes");
        editor.setText("y");
        expect(
            parent.querySelector(".cm-content")?.getAttribute("data-custom"),
        ).toBe("yes");
    });

    it("destroy removes the DOM and stops reporting changes", () => {
        const onChange = vi.fn();
        const editor = createMarkdownEditor(parent, { doc: "abc", onChange });
        const view = viewOf();
        editor.destroy();
        expect(parent.querySelector(".cm-editor")).toBeNull();
        view.dispatch({ changes: { from: 0, insert: "z" } });
        expect(onChange).not.toHaveBeenCalled();
    });

    it("names the editable area with ariaLabel", () => {
        createMarkdownEditor(parent, {
            doc: "",
            onChange: vi.fn(),
            ariaLabel: "Note text",
        });
        expect(viewOf().contentDOM.getAttribute("aria-label")).toBe(
            "Note text",
        );
    });

    it("readOnly refuses user input and keeps the text after setText", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "abc",
            onChange: vi.fn(),
            readOnly: true,
        });
        expect(viewOf().contentDOM.getAttribute("contenteditable")).toBe(
            "false",
        );
        editor.setText("xyz");
        expect(viewOf().contentDOM.getAttribute("contenteditable")).toBe(
            "false",
        );
        expect(viewOf().state.readOnly).toBe(true);
    });
});

describe("selection, blur, focus and label", () => {
    it("reports the main selection on moves and on edits", () => {
        const onSelectionChange = vi.fn();
        createMarkdownEditor(parent, {
            doc: "abc",
            onChange: vi.fn(),
            onSelectionChange,
        });
        const view = viewOf();

        view.dispatch({ selection: { anchor: 1, head: 3 } });
        expect(onSelectionChange).toHaveBeenLastCalledWith({ from: 1, to: 3 });

        view.dispatch({ changes: { from: 3, insert: "d" } });
        expect(onSelectionChange).toHaveBeenCalledTimes(2);
    });

    it("does not report a selection when nothing changed", () => {
        const onSelectionChange = vi.fn();
        createMarkdownEditor(parent, {
            doc: "abc",
            onChange: vi.fn(),
            onSelectionChange,
        });

        viewOf().dispatch({ effects: [] });

        expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("calls onBlur when the editor loses focus", () => {
        const onBlur = vi.fn();
        createMarkdownEditor(parent, {
            doc: "abc",
            onChange: vi.fn(),
            onBlur,
        });

        viewOf().contentDOM.dispatchEvent(new FocusEvent("blur"));

        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it("places the cursor at the given position on focus and clamps it", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "# ",
            onChange: vi.fn(),
        });
        const view = viewOf();

        editor.focus(2);
        expect(view.state.selection.main.head).toBe(2);

        editor.focus(99);
        expect(view.state.selection.main.head).toBe(2);

        editor.focus(-5);
        expect(view.state.selection.main.head).toBe(0);
    });

    it("keeps the cursor when focusing without a position", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "abcdef",
            onChange: vi.fn(),
        });
        const view = viewOf();
        view.dispatch({ selection: { anchor: 4 } });

        editor.focus();

        expect(view.state.selection.main.head).toBe(4);
    });

    it("changes the aria-label without resetting the document or the selection", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "abcdef",
            onChange: vi.fn(),
            ariaLabel: "old",
        });
        const view = viewOf();
        view.dispatch({ selection: { anchor: 2, head: 5 } });
        const content = parent.querySelector(".cm-content");

        editor.setLabel("new");

        expect(content?.getAttribute("aria-label")).toBe("new");
        expect(parent.querySelector(".cm-content")).toBe(content);
        expect(view.state.selection.main.from).toBe(2);
        expect(view.state.selection.main.to).toBe(5);
        expect(editor.getText()).toBe("abcdef");
    });

    it("keeps the new label after setText replaces the state", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "a",
            onChange: vi.fn(),
            ariaLabel: "old",
        });

        editor.setLabel("new");
        editor.setText("b");

        expect(
            parent.querySelector(".cm-content")?.getAttribute("aria-label"),
        ).toBe("new");
    });
});

describe("setText selection mapping", () => {
    function cursorAfter(doc: string, anchor: number, next: string): number {
        const editor = createMarkdownEditor(parent, {
            doc,
            onChange: vi.fn(),
        });
        viewOf().dispatch({ selection: { anchor } });
        editor.setText(next);
        return viewOf().state.selection.main.head;
    }

    it("shifts a cursor after an insertion above it", () => {
        expect(cursorAfter("# \nbody", 4, "# Plan\nbody")).toBe(8);
    });

    it("keeps a cursor before the change where it was", () => {
        expect(cursorAfter("abc def", 1, "abc XYZ def")).toBe(1);
    });

    it("moves a cursor inside a replaced region to the end of the replacement", () => {
        expect(cursorAfter("a [old] b", 5, "a [brand new] b")).toBe(
            "a [brand new".length,
        );
    });

    it("keeps a selection range mapped on both ends", () => {
        const editor = createMarkdownEditor(parent, {
            doc: "# \nbody here",
            onChange: vi.fn(),
        });
        viewOf().dispatch({ selection: { anchor: 3, head: 7 } });

        editor.setText("# Plan\nbody here");

        const { from, to } = viewOf().state.selection.main;
        expect([from, to]).toEqual([7, 11]);
    });
});
