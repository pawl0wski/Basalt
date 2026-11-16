import { undo } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
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

afterEach(() => parent.remove());

function viewOf(): EditorView {
    const view = EditorView.findFromDOM(parent);
    if (!view) throw new Error("no editor view");
    return view;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const file = (name = "a.png") => new File([Uint8Array.of(1, 2)], name);

function paste(files: File[], text = "") {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
        value: {
            files,
            getData: (type: string) => (type === "text/plain" ? text : ""),
        },
    });
    viewOf().contentDOM.dispatchEvent(event);
    return event;
}

function drop(files: File[], coords = { clientX: 0, clientY: 0 }) {
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
        value: {
            files,
            types: files.length ? ["Files"] : ["text/plain"],
            getData: () => "",
        },
    });
    Object.assign(event, coords);
    viewOf().contentDOM.dispatchEvent(event);
    return event;
}

function mount(
    doc: string,
    onFiles = vi.fn(async () => ["![a](a.png)"] as readonly string[]),
) {
    const editor = createMarkdownEditor(parent, {
        doc,
        onChange: vi.fn(),
        files: { onFiles },
    });
    return { editor, onFiles };
}

describe("file input", () => {
    it("hands pasted files with empty text to onFiles and inserts the link at the cursor", async () => {
        const { editor, onFiles } = mount("ab");
        viewOf().dispatch({ selection: { anchor: 1 } });
        const f = file();

        const event = paste([f]);
        await flush();

        expect(event.defaultPrevented).toBe(true);
        expect(onFiles).toHaveBeenCalledWith([f], "paste");
        expect(editor.getText()).toBe("a![a](a.png)b");
    });

    it("replaces the selection on paste", async () => {
        const { editor } = mount("hello world");
        viewOf().dispatch({ selection: { anchor: 0, head: 5 } });
        paste([file()]);
        await flush();
        expect(editor.getText()).toBe("![a](a.png) world");
    });

    it("leaves a paste with text to the default handling", async () => {
        const { onFiles } = mount("x");
        paste([file()], "copied text");
        await flush();
        expect(onFiles).not.toHaveBeenCalled();
    });

    it("ignores a paste without files", async () => {
        const { onFiles } = mount("x");
        paste([]);
        expect(onFiles).not.toHaveBeenCalled();
    });

    it("never inserts file contents as text on drop and inserts the link at the drop position", async () => {
        const { editor, onFiles } = mount("0123456789");
        vi.spyOn(viewOf(), "posAtCoords").mockReturnValue(4);
        const f = file();

        const event = drop([f]);
        await flush();

        expect(event.defaultPrevented).toBe(true);
        expect(onFiles).toHaveBeenCalledWith([f], "drop");
        expect(editor.getText()).toBe("0123![a](a.png)456789");
    });

    it("resolves a drop outside the text to the nearest position instead of the cursor", async () => {
        const { editor } = mount("0123456789");
        viewOf().dispatch({ selection: { anchor: 2 } });
        vi.spyOn(viewOf(), "posAtCoords").mockReturnValue(10);

        drop([file()], { clientX: 5, clientY: 900 });
        await flush();

        expect(editor.getText()).toBe("0123456789![a](a.png)");
    });

    it("leaves a drop without files (internal text drag) alone", async () => {
        const { onFiles } = mount("x");
        const event = drop([]);
        expect(event.defaultPrevented).toBe(false);
        expect(onFiles).not.toHaveBeenCalled();
    });

    it("allows dropping files by cancelling dragover for file drags only", () => {
        mount("x");
        const withFiles = new Event("dragover", {
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(withFiles, "dataTransfer", {
            value: { files: [], types: ["Files"] },
        });
        const text = new Event("dragover", { bubbles: true, cancelable: true });
        Object.defineProperty(text, "dataTransfer", {
            value: { files: [], types: ["text/plain"] },
        });
        viewOf().contentDOM.dispatchEvent(withFiles);
        viewOf().contentDOM.dispatchEvent(text);
        expect(withFiles.defaultPrevented).toBe(true);
        expect(text.defaultPrevented).toBe(false);
    });

    it("maps the position through edits made while the files are written", async () => {
        let finish: (links: string[]) => void = () => undefined;
        const { editor } = mount(
            "ab",
            vi.fn(
                () =>
                    new Promise<readonly string[]>(
                        (resolve) => (finish = resolve),
                    ),
            ),
        );
        viewOf().dispatch({ selection: { anchor: 1 } });
        paste([file()]);
        viewOf().dispatch({ changes: { from: 0, insert: "XX" } });
        viewOf().dispatch({ changes: { from: 4, insert: "YY" } });
        finish(["![a](a.png)"]);
        await flush();
        expect(editor.getText()).toBe("XXa![a](a.png)bYY");
    });

    it("keeps two overlapping pending inserts at their own positions", async () => {
        const resolvers: ((links: string[]) => void)[] = [];
        const { editor } = mount(
            "ab",
            vi.fn(
                () =>
                    new Promise<readonly string[]>((resolve) =>
                        resolvers.push(resolve),
                    ),
            ),
        );
        viewOf().dispatch({ selection: { anchor: 1 } });
        paste([file("one.png")]);
        viewOf().dispatch({ selection: { anchor: 2 } });
        paste([file("two.png")]);
        resolvers[1]?.(["![two](two.png)"]);
        await flush();
        resolvers[0]?.(["![one](one.png)"]);
        await flush();
        expect(editor.getText()).toBe("a![one](one.png)b![two](two.png)");
    });

    it("puts several links on their own lines, adding breaks only where needed", async () => {
        const links = ["![a](a.png)", "![b](b.png)"];
        const cases: [string, number, string][] = [
            ["", 0, "![a](a.png)\n![b](b.png)"],
            ["ab", 1, "a\n![a](a.png)\n![b](b.png)\nb"],
            ["ab", 2, "ab\n![a](a.png)\n![b](b.png)"],
            ["ab", 0, "![a](a.png)\n![b](b.png)\nab"],
            ["x\n\ny", 2, "x\n![a](a.png)\n![b](b.png)\ny"],
        ];
        for (const [doc, anchor, expected] of cases) {
            parent.replaceChildren();
            const { editor } = mount(
                doc,
                vi.fn(async () => links),
            );
            viewOf().dispatch({ selection: { anchor } });
            paste([file(), file("b.png")]);
            await flush();
            expect(editor.getText()).toBe(expected);
            editor.destroy();
        }
    });

    it("inserts nothing for an empty or rejected result", async () => {
        const empty = mount(
            "ab",
            vi.fn(async () => []),
        );
        paste([file()]);
        await flush();
        expect(empty.editor.getText()).toBe("ab");
        empty.editor.destroy();
        parent.replaceChildren();

        const rejected = mount(
            "ab",
            vi.fn(async () => Promise.reject(new Error("x"))),
        );
        paste([file()]);
        await flush();
        expect(rejected.editor.getText()).toBe("ab");
    });

    it("drops the result when the editor is destroyed or the text is replaced meanwhile", async () => {
        let finish: (links: string[]) => void = () => undefined;
        const first = mount(
            "ab",
            vi.fn(
                () =>
                    new Promise<readonly string[]>(
                        (resolve) => (finish = resolve),
                    ),
            ),
        );
        paste([file()]);
        first.editor.setText("from disk");
        finish(["![a](a.png)"]);
        await flush();
        expect(first.editor.getText()).toBe("from disk");

        const view = viewOf();
        paste([file()]);
        first.editor.destroy();
        finish(["![a](a.png)"]);
        await flush();
        expect(view.state.doc.toString()).toBe("from disk");
    });

    it("inserts the links as a single undo step", async () => {
        const { editor } = mount("ab");
        viewOf().dispatch({ selection: { anchor: 1 } });
        paste([file(), file("b.png")]);
        await flush();
        expect(editor.getText()).not.toBe("ab");
        undo(viewOf());
        expect(editor.getText()).toBe("ab");
    });

    it("does nothing in a read-only editor", async () => {
        const onFiles = vi.fn(async () => ["![a](a.png)"] as readonly string[]);
        createMarkdownEditor(parent, {
            doc: "ab",
            onChange: vi.fn(),
            readOnly: true,
            files: { onFiles },
        });
        paste([file()]);
        drop([file()]);
        await flush();
        expect(onFiles).not.toHaveBeenCalled();
    });

    it("does not intercept events without file options", () => {
        createMarkdownEditor(parent, { doc: "x", onChange: vi.fn() });
        drop([file()]);
        expect(viewOf().state.doc.toString()).toBe("x");
    });
});
