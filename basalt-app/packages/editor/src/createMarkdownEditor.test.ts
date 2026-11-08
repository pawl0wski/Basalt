import { EditorView } from "@codemirror/view";
import { undo } from "@codemirror/commands";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMarkdownEditor } from "./createMarkdownEditor";

let parent: HTMLElement;

beforeEach(() => {
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
});
