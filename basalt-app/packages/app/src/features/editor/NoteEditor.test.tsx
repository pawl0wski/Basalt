import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import { NoteEditor } from "./NoteEditor";

function viewIn(container: HTMLElement): EditorView {
    const view = EditorView.findFromDOM(container);
    if (!view) throw new Error("no editor view");
    return view;
}

function type(container: HTMLElement, insert: string) {
    const view = viewIn(container);
    view.dispatch({ changes: { from: view.state.doc.length, insert } });
}

describe("NoteEditor", () => {
    it("shows the text and names the editable area", () => {
        render(<NoteEditor label="Ideas" text="# Hello" onChange={vi.fn()} />);

        const input = screen.getByRole("textbox", { name: "Ideas" });
        expect(input).toHaveTextContent("# Hello");
    });

    it("reports typed text through onChange", () => {
        const onChange = vi.fn();
        const { container } = render(
            <NoteEditor label="n" text="abc" onChange={onChange} />,
        );

        type(container, "d");

        expect(onChange).toHaveBeenCalledExactlyOnceWith("abcd");
    });

    it("pushes external text changes into the editor without echoing onChange", () => {
        const onChange = vi.fn();
        const { container, rerender } = render(
            <NoteEditor label="n" text="old" onChange={onChange} />,
        );

        rerender(<NoteEditor label="n" text="from disk" onChange={onChange} />);

        expect(viewIn(container).state.doc.toString()).toBe("from disk");
        expect(onChange).not.toHaveBeenCalled();
    });

    it("does not overwrite the editor when the prop catches up with typed text", () => {
        const onChange = vi.fn();
        const { container, rerender } = render(
            <NoteEditor label="n" text="a" onChange={onChange} />,
        );

        type(container, "b");
        type(container, "c");
        rerender(<NoteEditor label="n" text="ab" onChange={onChange} />);
        rerender(<NoteEditor label="n" text="abc" onChange={onChange} />);

        expect(viewIn(container).state.doc.toString()).toBe("abc");
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("keeps one editor instance across text updates", () => {
        const { container, rerender } = render(
            <NoteEditor label="n" text="a" onChange={vi.fn()} />,
        );
        const view = viewIn(container);

        rerender(<NoteEditor label="n" text="b" onChange={vi.fn()} />);

        expect(viewIn(container)).toBe(view);
    });

    it("uses the latest onChange callback", () => {
        const first = vi.fn();
        const second = vi.fn();
        const { container, rerender } = render(
            <NoteEditor label="n" text="a" onChange={first} />,
        );

        rerender(<NoteEditor label="n" text="a" onChange={second} />);
        type(container, "b");

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledWith("ab");
    });

    it("focuses the editor when a focus request arrives", () => {
        const { rerender } = render(
            <NoteEditor label="n" text="" onChange={vi.fn()} />,
        );
        expect(screen.getByRole("textbox")).not.toHaveFocus();

        rerender(
            <NoteEditor
                label="n"
                text=""
                onChange={vi.fn()}
                focusRequest={1}
            />,
        );

        expect(screen.getByRole("textbox")).toHaveFocus();
    });

    it("focuses on mount when a focus request is already pending", () => {
        render(
            <NoteEditor
                label="n"
                text=""
                onChange={vi.fn()}
                focusRequest={3}
            />,
        );

        expect(screen.getByRole("textbox")).toHaveFocus();
    });

    it("does not focus without a focus request", () => {
        render(<NoteEditor label="n" text="x" onChange={vi.fn()} />);

        expect(screen.getByRole("textbox")).not.toHaveFocus();
    });

    it("destroys the editor on unmount", () => {
        const { container, unmount } = render(
            <NoteEditor label="n" text="x" onChange={vi.fn()} />,
        );
        expect(container.querySelector(".cm-editor")).not.toBeNull();

        unmount();

        expect(document.querySelector(".cm-editor")).toBeNull();
    });

    it("is not editable when read only", () => {
        render(<NoteEditor label="n" text="x" onChange={vi.fn()} readOnly />);

        expect(screen.getByRole("textbox")).toHaveAttribute(
            "contenteditable",
            "false",
        );
    });

    it("changes the label without recreating the editor or moving the cursor", () => {
        const { container, rerender } = render(
            <NoteEditor label="old" text="# Title\nbody" onChange={vi.fn()} />,
        );
        const view = viewIn(container);
        view.dispatch({ selection: { anchor: 4, head: 6 } });

        rerender(
            <NoteEditor label="new" text="# Title\nbody" onChange={vi.fn()} />,
        );

        expect(viewIn(container)).toBe(view);
        expect(
            screen.getByRole("textbox", { name: "new" }),
        ).toBeInTheDocument();
        expect(view.state.selection.main.from).toBe(4);
        expect(view.state.selection.main.to).toBe(6);
    });

    it("calls onTitleLeave when the cursor leaves the heading and on blur", () => {
        const onTitleLeave = vi.fn();
        const { container } = render(
            <NoteEditor
                label="n"
                text={"# Title\nbody"}
                onChange={vi.fn()}
                onTitleLeave={onTitleLeave}
            />,
        );
        const view = viewIn(container);

        view.dispatch({ selection: { anchor: 3 } });
        expect(onTitleLeave).not.toHaveBeenCalled();

        view.dispatch({ selection: { anchor: 10 } });
        expect(onTitleLeave).toHaveBeenCalledTimes(1);

        view.dispatch({ selection: { anchor: 3 } });
        view.contentDOM.dispatchEvent(new FocusEvent("blur"));
        expect(onTitleLeave).toHaveBeenCalledTimes(2);
    });

    it("focuses at the requested position", () => {
        const { container } = render(
            <NoteEditor
                label="n"
                text="# "
                onChange={vi.fn()}
                focusRequest={1}
                focusPosition={2}
            />,
        );

        expect(viewIn(container).state.selection.main.head).toBe(2);
    });
});
