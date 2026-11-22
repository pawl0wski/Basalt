import { history, undo, redo } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMarkdownEditor } from "./createMarkdownEditor";
import type { ImageOptions, ImageSource } from "./imagePreview";

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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const options = (
    resolve: (d: string) => Promise<ImageSource> = async (d) => ({
        kind: "image",
        src: `blob:${d}`,
        width: null,
        height: null,
    }),
): ImageOptions => ({
    resolve,
    release: vi.fn(),
    labels: { loading: "Loading", broken: "Broken", resize: "Resize image" },
});

async function mount(doc: string, opts = options(), readOnly = false) {
    const onChange = vi.fn();
    const editor = createMarkdownEditor(parent, {
        doc,
        onChange,
        readOnly,
        images: opts,
        extensions: [history()],
    });
    await flush();
    const view = EditorView.findFromDOM(parent) as EditorView;
    return { editor, view, onChange };
}

const handle = () =>
    parent.querySelector<HTMLButtonElement>(".cm-image-resize-handle");
const img = () =>
    parent.querySelector<HTMLImageElement>("img.cm-image-preview");

function key(target: HTMLElement, name: string, init: KeyboardEventInit = {}) {
    target.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: name,
            bubbles: true,
            cancelable: true,
            ...init,
        }),
    );
}

function drag(target: HTMLElement, from: number, to: number) {
    const at = (type: string, clientX: number) =>
        target.dispatchEvent(
            new MouseEvent(type, { clientX, bubbles: true, cancelable: true }),
        );
    at("pointerdown", from);
    at("pointermove", to);
    at("pointerup", to);
}

describe("image resize handle", () => {
    it("updates the selected occurrence when images share a destination and line", async () => {
        const { editor, view } = await mount("![a|120](x.png) ![b|300](x.png)");
        const handles = parent.querySelectorAll<HTMLButtonElement>(
            ".cm-image-resize-handle",
        );
        view.dispatch({ changes: { from: 0, insert: "intro\n\n" } });

        key(handles[0], "ArrowRight");
        key(handles[1], "ArrowLeft");

        expect(editor.getText()).toBe(
            "intro\n\n![a|130](x.png) ![b|290](x.png)",
        );
    });

    it("renders the preview without a resize handle in a read-only editor", async () => {
        const { onChange } = await mount("![a|120](x.png)", options(), true);
        expect(img()?.style.width).toBe("120px");
        expect(handle()).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });

    it.each(["Escape", "edit"])(
        "cancels a drag on %s before release",
        async (reason) => {
            const { editor, view } = await mount("![a|120](x.png)");
            const target = handle() as HTMLElement;
            vi.spyOn(
                img() as HTMLElement,
                "getBoundingClientRect",
            ).mockReturnValue({ width: 120 } as DOMRect);
            target.dispatchEvent(
                new MouseEvent("pointerdown", { bubbles: true }),
            );
            target.dispatchEvent(
                new MouseEvent("pointermove", { clientX: 50, bubbles: true }),
            );
            expect(img()?.style.width).toBe("170px");

            if (reason === "Escape") key(view.contentDOM, "Escape");
            else view.dispatch({ changes: { from: 0, insert: "before " } });

            expect(img()?.style.width).toBe("120px");
            target.dispatchEvent(
                new MouseEvent("pointerup", { clientX: 50, bubbles: true }),
            );
            expect(editor.getText()).toBe(
                reason === "Escape"
                    ? "![a|120](x.png)"
                    : "before ![a|120](x.png)",
            );
        },
    );

    it("exposes the slider name, bounds and width after keyboard resizing", async () => {
        await mount("![a|120](x.png)");
        const slider = handle() as HTMLButtonElement;
        expect(slider.tabIndex).toBe(0);
        expect(slider.getAttribute("role")).toBe("slider");
        expect(slider.getAttribute("aria-label")).toBe("Resize image");
        expect(slider.getAttribute("aria-valuemin")).toBe("40");
        expect(slider.getAttribute("aria-valuemax")).toBe("2000");
        expect(slider.getAttribute("aria-valuenow")).toBe("120");

        key(slider, "ArrowRight");

        expect(slider.getAttribute("aria-valuenow")).toBe("130");
    });

    it("keeps table images visible without offering a resize handle", async () => {
        await mount("| Image |\n| --- |\n| ![a](x.png) |");
        expect(img()?.alt).toBe("a");
        expect(handle()).toBeNull();
    });

    it("offers no handle for a placeholder", async () => {
        await mount(
            "![a](x.png)",
            options(async () => ({ kind: "placeholder", label: "Missing" })),
        );
        expect(handle()).toBeNull();
    });

    it("renders a stored width on the image and hides the suffix from the alt text", async () => {
        await mount("![photo|300](x.png)");
        expect(img()?.style.width).toBe("300px");
        expect(img()?.alt).toBe("photo");
    });

    it("renders a stored width outside the bounds clamped", async () => {
        await mount("![photo|5](x.png)");
        expect(img()?.style.width).toBe("40px");
    });

    it("leaves the width unset when no suffix is stored", async () => {
        await mount("![photo](x.png)");
        expect(img()?.style.width).toBe("");
    });

    it("does not change the document while rendering", async () => {
        const { editor, onChange } = await mount("![photo|300](x.png)\n");
        expect(editor.getText()).toBe("![photo|300](x.png)\n");
        expect(onChange).not.toHaveBeenCalled();
    });

    it("changes the document once on release, not during the drag", async () => {
        const { editor, onChange } = await mount("![photo](x.png)");
        const target = handle() as HTMLElement;
        vi.spyOn(img() as HTMLElement, "getBoundingClientRect").mockReturnValue(
            {
                width: 200,
            } as DOMRect,
        );

        target.dispatchEvent(
            new MouseEvent("pointerdown", { clientX: 10, bubbles: true }),
        );
        target.dispatchEvent(
            new MouseEvent("pointermove", { clientX: 110, bubbles: true }),
        );
        expect(img()?.style.width).toBe("300px");
        expect(onChange).not.toHaveBeenCalled();
        expect(editor.getText()).toBe("![photo](x.png)");

        target.dispatchEvent(
            new MouseEvent("pointerup", { clientX: 110, bubbles: true }),
        );
        expect(editor.getText()).toBe("![photo|300](x.png)");
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("clamps a drag to the minimum and maximum width", async () => {
        const { editor } = await mount("![p](x.png)");
        vi.spyOn(img() as HTMLElement, "getBoundingClientRect").mockReturnValue(
            {
                width: 200,
            } as DOMRect,
        );
        drag(handle() as HTMLElement, 500, 0);
        expect(editor.getText()).toBe("![p|40](x.png)");
        vi.spyOn(img() as HTMLElement, "getBoundingClientRect").mockReturnValue(
            {
                width: 1000,
            } as DOMRect,
        );
        drag(handle() as HTMLElement, 0, 5000);
        expect(editor.getText()).toBe("![p|2000](x.png)");
    });

    it("keeps the document and the stored width when the drag ends where it began", async () => {
        const { editor, onChange } = await mount("![p|120](x.png)");
        vi.spyOn(img() as HTMLElement, "getBoundingClientRect").mockReturnValue(
            {
                width: 120,
            } as DOMRect,
        );
        drag(handle() as HTMLElement, 50, 50);
        expect(editor.getText()).toBe("![p|120](x.png)");
        expect(onChange).not.toHaveBeenCalled();
        expect(img()?.style.width).toBe("120px");
    });

    it("restores the stored width and leaves the text when the drag is cancelled", async () => {
        const { editor } = await mount("![p|120](x.png)");
        vi.spyOn(img() as HTMLElement, "getBoundingClientRect").mockReturnValue(
            {
                width: 120,
            } as DOMRect,
        );
        const target = handle() as HTMLElement;
        target.dispatchEvent(
            new MouseEvent("pointerdown", { clientX: 0, bubbles: true }),
        );
        target.dispatchEvent(
            new MouseEvent("pointermove", { clientX: 80, bubbles: true }),
        );
        expect(img()?.style.width).toBe("200px");
        target.dispatchEvent(
            new MouseEvent("pointercancel", { bubbles: true }),
        );
        expect(img()?.style.width).toBe("120px");
        expect(editor.getText()).toBe("![p|120](x.png)");
    });

    it("ignores a drag started with a non-primary button", async () => {
        const { editor } = await mount("![p](x.png)");
        const target = handle() as HTMLElement;
        target.dispatchEvent(
            new MouseEvent("pointerdown", { button: 2, bubbles: true }),
        );
        target.dispatchEvent(
            new MouseEvent("pointerup", { clientX: 200, bubbles: true }),
        );
        expect(editor.getText()).toBe("![p](x.png)");
    });

    it("removes the suffix on double click", async () => {
        const { editor } = await mount("![p|300](x.png)");
        handle()?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        expect(editor.getText()).toBe("![p](x.png)");
    });

    it("does nothing on double click when there is no stored width", async () => {
        const { onChange } = await mount("![p](x.png)");
        handle()?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it("adjusts by 10 and 50 pixels, to the bounds, and resets with Delete", async () => {
        const { editor } = await mount("![p|300](x.png)");
        const target = () => handle() as HTMLElement;
        key(target(), "ArrowRight");
        expect(editor.getText()).toBe("![p|310](x.png)");
        key(target(), "ArrowLeft", { shiftKey: true });
        expect(editor.getText()).toBe("![p|260](x.png)");
        key(target(), "Home");
        expect(editor.getText()).toBe("![p|40](x.png)");
        key(target(), "ArrowLeft");
        expect(editor.getText()).toBe("![p|40](x.png)");
        key(target(), "End");
        expect(editor.getText()).toBe("![p|2000](x.png)");
        key(target(), "Delete");
        expect(editor.getText()).toBe("![p](x.png)");
    });

    it("resets with Backspace and ignores other keys", async () => {
        const { editor, onChange } = await mount("![p|300](x.png)");
        key(handle() as HTMLElement, "a");
        expect(onChange).not.toHaveBeenCalled();
        key(handle() as HTMLElement, "Backspace");
        expect(editor.getText()).toBe("![p](x.png)");
    });

    it("keeps the rest of the alt text and the destination", async () => {
        const { editor } = await mount('see ![a|b](dir/x.png "t") end');
        key(handle() as HTMLElement, "End");
        expect(editor.getText()).toBe('see ![a|b|2000](dir/x.png "t") end');
    });

    it("resizes the matching image among several", async () => {
        const { editor } = await mount("![a](one.png)\n\n![b](two.png)");
        const handles = parent.querySelectorAll<HTMLElement>(
            ".cm-image-resize-handle",
        );
        key(handles[1], "Home");
        expect(editor.getText()).toBe("![a](one.png)\n\n![b|40](two.png)");
    });

    it("makes each resize one undo step and redo reapplies it", async () => {
        const { editor, view } = await mount("![p](x.png)");
        key(handle() as HTMLElement, "Home");
        key(handle() as HTMLElement, "ArrowRight");
        expect(editor.getText()).toBe("![p|50](x.png)");
        undo(view);
        expect(editor.getText()).toBe("![p|40](x.png)");
        undo(view);
        expect(editor.getText()).toBe("![p](x.png)");
        redo(view);
        expect(editor.getText()).toBe("![p|40](x.png)");
    });

    it("keeps the same image element when the width changes", async () => {
        const { editor } = await mount("![p](x.png)");
        const before = img();
        key(handle() as HTMLElement, "Home");
        expect(editor.getText()).toBe("![p|40](x.png)");
        expect(img()).toBe(before);
        expect(img()?.style.width).toBe("40px");
    });
});
