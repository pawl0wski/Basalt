import { EditorView } from "@codemirror/view";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMarkdownEditor } from "./createMarkdownEditor";
import type { ImageOptions, ImageSource } from "./imagePreview";

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

const labels = {
    loading: "Loading…",
    broken: "Broken",
    resize: "Resize image",
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function imageOptions(
    resolve: (destination: string) => Promise<ImageSource> = async (d) => ({
        kind: "image",
        src: `blob:${d}`,
        width: null,
        height: null,
    }),
) {
    const release = vi.fn();
    const spy = vi.fn(resolve);
    const options: ImageOptions = { resolve: spy, release, labels };
    return { options, resolve: spy, release };
}

function mount(doc: string, options: ImageOptions) {
    return createMarkdownEditor(parent, {
        doc,
        onChange: vi.fn(),
        images: options,
    });
}

const widgets = () => [...parent.querySelectorAll(".cm-image-widget")];

describe("image preview", () => {
    it("renders one widget per image in document order", async () => {
        const { options } = imageOptions();
        mount(
            "![a](one.png)\ntext\n![b](two.png) and ![c](three.png)",
            options,
        );
        await flush();
        const sources = [
            ...parent.querySelectorAll<HTMLImageElement>(
                "img.cm-image-preview",
            ),
        ].map((img) => img.getAttribute("src"));
        expect(sources).toEqual([
            "blob:one.png",
            "blob:two.png",
            "blob:three.png",
        ]);
        expect(widgets()).toHaveLength(3);
    });

    it("renders no widget in code, for reference-style images or empty destinations", async () => {
        const { options, resolve } = imageOptions();
        mount(
            "```\n![a](x.png)\n```\n`![b](y.png)`\n![c][ref]\n![d]()\n[ref]: z.png",
            options,
        );
        await flush();
        expect(widgets()).toHaveLength(0);
        expect(resolve).not.toHaveBeenCalled();
    });

    it("shows the loading label first and a placeholder with its label", async () => {
        let finish: (source: ImageSource) => void = () => undefined;
        const { options } = imageOptions(
            () => new Promise((resolve) => (finish = resolve)),
        );
        mount("![a](x.png)", options);
        expect(parent.querySelector(".cm-image-loading")?.textContent).toBe(
            "Loading…",
        );
        finish({ kind: "placeholder", label: "Image not found: x.png" });
        await flush();
        expect(parent.querySelector(".cm-image-placeholder")?.textContent).toBe(
            "Image not found: x.png",
        );
        expect(
            parent.querySelector<HTMLImageElement>("img.cm-image-preview"),
        ).toBeNull();
    });

    it("sets width and height only when dimensions are known", async () => {
        const { options } = imageOptions(async (d) =>
            d === "a.png"
                ? { kind: "image", src: "blob:a", width: 40, height: 30 }
                : { kind: "image", src: "blob:b", width: null, height: null },
        );
        mount("![a](a.png)\n![b](b.png)", options);
        await flush();
        const [a, b] = [
            ...parent.querySelectorAll<HTMLImageElement>(
                "img.cm-image-preview",
            ),
        ];
        expect([a?.getAttribute("width"), a?.getAttribute("height")]).toEqual([
            "40",
            "30",
        ]);
        expect([b?.hasAttribute("width"), b?.hasAttribute("height")]).toEqual([
            false,
            false,
        ]);
        expect(a?.draggable).toBe(false);
        expect(a?.alt).toBe("a");
    });

    it("falls back to the broken label when the image fails to decode or resolve fails", async () => {
        const { options } = imageOptions(async (d) => {
            if (d === "bad.png") throw new Error("boom");
            return { kind: "image", src: "blob:x", width: null, height: null };
        });
        mount("![a](bad.png)\n![b](ok.png)", options);
        await flush();
        expect(parent.querySelector(".cm-image-placeholder")?.textContent).toBe(
            "Broken",
        );
        parent
            .querySelector<HTMLImageElement>("img.cm-image-preview")
            ?.dispatchEvent(new Event("error"));
        expect(
            [...parent.querySelectorAll(".cm-image-placeholder")].map(
                (n) => n.textContent,
            ),
        ).toEqual(["Broken", "Broken"]);
    });

    it("releases a destination when its widget is removed", async () => {
        const { options, release } = imageOptions();
        const editor = mount("![a](x.png)", options);
        await flush();
        expect(release).not.toHaveBeenCalled();
        viewOf().dispatch({ changes: { from: 0, to: 11, insert: "plain" } });
        expect(release).toHaveBeenCalledWith("x.png");
        expect(release).toHaveBeenCalledTimes(1);
        editor.destroy();
    });

    it("releases once per resolve call, including refreshes", async () => {
        const { options, release } = imageOptions();
        const editor = mount("![a](x.png)", options);
        await flush();
        editor.refreshImages();
        await flush();
        editor.destroy();
        expect(release).toHaveBeenCalledTimes(2);
    });

    it("does not resolve again while typing elsewhere", async () => {
        const { options, resolve } = imageOptions();
        mount("![a](x.png)\n\nnote", options);
        await flush();
        viewOf().dispatch({ changes: { from: 17, insert: "s" } });
        viewOf().dispatch({ selection: { anchor: 0 } });
        await flush();
        expect(resolve).toHaveBeenCalledTimes(1);
        expect(widgets()).toHaveLength(1);
    });

    it("updates alt without resolving again", async () => {
        const { options, resolve } = imageOptions();
        mount("![a](x.png)", options);
        await flush();
        viewOf().dispatch({ changes: { from: 2, insert: "bc" } });
        await flush();
        expect(
            parent.querySelector<HTMLImageElement>("img.cm-image-preview")?.alt,
        ).toBe("bca");
        expect(resolve).toHaveBeenCalledTimes(1);
    });

    it("refreshImages re-resolves and updates the DOM only when the result changed", async () => {
        let src = "blob:1";
        const { options, resolve } = imageOptions(async () => ({
            kind: "image",
            src,
            width: null,
            height: null,
        }));
        const editor = mount("![a](x.png)", options);
        await flush();
        const img = parent.querySelector<HTMLImageElement>(
            "img.cm-image-preview",
        );
        editor.refreshImages();
        await flush();
        expect(resolve).toHaveBeenCalledTimes(2);
        expect(
            parent.querySelector<HTMLImageElement>("img.cm-image-preview"),
        ).toBe(img);
        src = "blob:2";
        editor.refreshImages();
        await flush();
        expect(
            parent
                .querySelector<HTMLImageElement>("img.cm-image-preview")
                ?.getAttribute("src"),
        ).toBe("blob:2");
    });

    it("turns a placeholder into the image on refresh", async () => {
        let missing = true;
        const { options } = imageOptions(async () =>
            missing
                ? { kind: "placeholder", label: "Image not found" }
                : { kind: "image", src: "blob:new", width: null, height: null },
        );
        const editor = mount("![a](x.png)", options);
        await flush();
        missing = false;
        editor.refreshImages();
        await flush();
        expect(parent.querySelector(".cm-image-placeholder")).toBeNull();
        expect(
            parent
                .querySelector<HTMLImageElement>("img.cm-image-preview")
                ?.getAttribute("src"),
        ).toBe("blob:new");
    });

    it("never changes the text", async () => {
        const source = "![a](x.png)\ntext";
        const { options } = imageOptions();
        const editor = mount(source, options);
        await flush();
        viewOf().dispatch({ selection: { anchor: source.length } });
        expect(editor.getText()).toBe(source);
    });

    it("hides the image source off the cursor line and shows it on the cursor line", async () => {
        const { options } = imageOptions();
        mount("![a](x.png)\ntext ![b](y.png) more", options);
        await flush();
        const lineTexts = () =>
            [...parent.querySelectorAll(".cm-line")].map((l) => l.textContent);
        expect(lineTexts()[0]).toBe("![a](x.png)");
        expect(lineTexts()[1]).toBe("text  more");
        viewOf().dispatch({ selection: { anchor: 15 } });
        expect(lineTexts()[0]).toBe("");
        expect(lineTexts()[1]).toBe("text ![b](y.png) more");
    });

    it("adds widgets for images near the end of a long document once parsing finishes", async () => {
        const { options } = imageOptions();
        const filler = Array.from(
            { length: 60000 },
            (_, i) => `line ${i} *x*`,
        ).join("\n");
        mount(`${filler}\n![late](late.png)`, options);
        const count = () => {
            const view = viewOf();
            let total = 0;
            for (const source of view.state.facet(EditorView.decorations)) {
                const set =
                    typeof source === "function" ? source(view) : source;
                const cursor = set.iter();
                while (cursor.value) {
                    if (cursor.value.spec.widget) total += 1;
                    cursor.next();
                }
            }
            return total;
        };
        await vi.waitFor(() => expect(count()).toBe(1), { timeout: 8000 });
    });

    it("shows no widgets without image options", () => {
        createMarkdownEditor(parent, { doc: "![a](x.png)", onChange: vi.fn() });
        expect(widgets()).toHaveLength(0);
        expect(() => viewOf()).not.toThrow();
    });
});
