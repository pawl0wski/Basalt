import { isolateHistory } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import {
    type EditorState,
    type Extension,
    type Range,
    StateField,
} from "@codemirror/state";
import {
    Decoration,
    type DecorationSet,
    EditorView,
    WidgetType,
} from "@codemirror/view";
import {
    MAX_IMAGE_WIDTH,
    MIN_IMAGE_WIDTH,
    clampImageWidth,
    formatImageAlt,
    parseImageAlt,
} from "./imageWidth";
import { activeLineNumbers } from "./livePreview";

export type ImageSource =
    | {
          kind: "image";
          src: string;
          width: number | null;
          height: number | null;
      }
    | { kind: "placeholder"; label: string };

export interface ImageOptions {
    resolve(destination: string): Promise<ImageSource>;
    release(destination: string): void;
    labels: { loading: string; broken: string; resize: string };
}

export interface ImagePreview {
    extension: Extension;
    refresh(): void;
}

const DEFAULT_ESTIMATED_HEIGHT = 120;
const DEFAULT_COLUMN_WIDTH = 700;
const SVG_NS = "http://www.w3.org/2000/svg";
const hiddenSource = Decoration.replace({});

interface Mounted {
    destination: string;
    resolveCount: number;
    destroyed: boolean;
    box: HTMLElement;
    shownKey: string | null;
    view: EditorView;
    show(source: ImageSource): void;
}

function iconElement(): SVGElement {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "cm-image-placeholder-icon");
    const frame = document.createElementNS(SVG_NS, "rect");
    frame.setAttribute("x", "1.5");
    frame.setAttribute("y", "2.5");
    frame.setAttribute("width", "13");
    frame.setAttribute("height", "11");
    frame.setAttribute("rx", "1.5");
    frame.setAttribute("fill", "none");
    frame.setAttribute("stroke", "currentColor");
    const hill = document.createElementNS(SVG_NS, "path");
    hill.setAttribute("d", "M2 12l4-4 3 3 2-2 3 3");
    hill.setAttribute("fill", "none");
    hill.setAttribute("stroke", "currentColor");
    svg.append(frame, hill);
    return svg;
}

function sourceKey(source: ImageSource): string {
    return source.kind === "image"
        ? `image:${source.src}`
        : `placeholder:${source.label}`;
}

export function createImagePreview(options: ImageOptions): ImagePreview {
    const mounted = new Set<Mounted>();
    const dimensions = new Map<string, { width: number; height: number }>();

    function placeholder(label: string): HTMLElement {
        const box = document.createElement("div");
        box.className = "cm-image-placeholder";
        box.setAttribute("role", "img");
        box.setAttribute("aria-label", label);
        const text = document.createElement("span");
        text.textContent = label;
        box.append(iconElement(), text);
        return box;
    }

    function requestRender(
        record: Mounted,
        alt: () => string,
        source: ImageSource,
    ) {
        if (record.destroyed) return;
        const key = sourceKey(source);
        if (record.shownKey === key) return;
        record.shownKey = key;
        record.box.replaceChildren();
        if (source.kind === "placeholder") {
            record.box.append(placeholder(source.label));
            record.view.requestMeasure();
            return;
        }
        if (source.width !== null && source.height !== null) {
            dimensions.set(record.destination, {
                width: source.width,
                height: source.height,
            });
        }
        const img = document.createElement("img");
        img.className = "cm-image-preview";
        img.alt = parseImageAlt(alt()).alt;
        img.draggable = false;
        if (source.width !== null && source.height !== null) {
            img.width = source.width;
            img.height = source.height;
        }
        const frame = document.createElement("div");
        frame.className = "cm-image-frame";
        applyWidth(img, parseImageAlt(alt()).width);
        img.addEventListener("load", () => record.view.requestMeasure());
        img.addEventListener("error", () => {
            if (record.destroyed) return;
            record.shownKey = "broken";
            record.box.replaceChildren(placeholder(options.labels.broken));
            record.view.requestMeasure();
        });
        img.src = source.src;
        frame.append(img, createHandle(record, img));
        record.box.append(frame);
        record.view.requestMeasure();
    }

    function applyWidth(img: HTMLImageElement, width: number | null) {
        img.style.width = width === null ? "" : `${width}px`;
    }

    function commitWidth(record: Mounted, width: number | null) {
        const { view, box } = record;
        const pos = view.posAtDOM(box);
        const line = view.state.doc.lineAt(pos);
        let target: { from: number; to: number; alt: string } | null = null;
        syntaxTree(view.state).iterate({
            from: line.from,
            to: line.to,
            enter: (node) => {
                if (node.name !== "Image") return;
                const url = node.node.getChild("URL");
                if (!url) return false;
                const destination = view.state.doc.sliceString(
                    url.from,
                    url.to,
                );
                if (destination !== record.destination) return false;
                const marks = node.node.getChildren("LinkMark");
                const from = marks[0]?.to ?? node.from + 2;
                const to = marks[1]?.from ?? from;
                target = {
                    from,
                    to,
                    alt: view.state.doc.sliceString(from, to),
                };
                return false;
            },
        });
        const found = target as {
            from: number;
            to: number;
            alt: string;
        } | null;
        if (!found) return;
        const insert = formatImageAlt(parseImageAlt(found.alt).alt, width);
        if (insert === found.alt) return;
        view.dispatch({
            changes: { from: found.from, to: found.to, insert },
            userEvent: "input.resize",
            annotations: isolateHistory.of("full"),
        });
    }

    function createHandle(record: Mounted, img: HTMLImageElement): HTMLElement {
        const handle = document.createElement("button");
        handle.type = "button";
        handle.className = "cm-image-resize-handle";
        handle.setAttribute("aria-label", options.labels.resize);
        const storedWidth = () =>
            parseImageAlt(record.box.dataset.alt ?? "").width;
        const currentWidth = () =>
            storedWidth() ?? Math.round(img.getBoundingClientRect().width);
        let drag: { startX: number; startWidth: number; width: number } | null =
            null;
        handle.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            handle.setPointerCapture?.(event.pointerId);
            const startWidth = Math.round(img.getBoundingClientRect().width);
            drag = { startX: event.clientX, startWidth, width: startWidth };
        });
        handle.addEventListener("pointermove", (event) => {
            if (!drag) return;
            drag.width = clampImageWidth(
                drag.startWidth + event.clientX - drag.startX,
            );
            applyWidth(img, drag.width);
        });
        const finish = (event: PointerEvent) => {
            if (!drag) return;
            const done = drag;
            drag = null;
            handle.releasePointerCapture?.(event.pointerId);
            if (event.type === "pointercancel") {
                applyWidth(img, storedWidth());
                return;
            }
            if (done.width === done.startWidth) {
                applyWidth(img, storedWidth());
                return;
            }
            commitWidth(record, done.width);
        };
        handle.addEventListener("pointerup", finish);
        handle.addEventListener("pointercancel", finish);
        handle.addEventListener("dblclick", (event) => {
            event.preventDefault();
            commitWidth(record, null);
        });
        handle.addEventListener("keydown", (event) => {
            const step = event.shiftKey ? 50 : 10;
            let next: number | null | undefined;
            if (event.key === "ArrowLeft") next = currentWidth() - step;
            else if (event.key === "ArrowRight") next = currentWidth() + step;
            else if (event.key === "Home") next = MIN_IMAGE_WIDTH;
            else if (event.key === "End") next = MAX_IMAGE_WIDTH;
            else if (event.key === "Delete" || event.key === "Backspace")
                next = null;
            if (next === undefined) return;
            event.preventDefault();
            event.stopPropagation();
            commitWidth(record, next === null ? null : clampImageWidth(next));
        });
        return handle;
    }

    class ImageWidget extends WidgetType {
        constructor(
            readonly destination: string,
            readonly alt: string,
        ) {
            super();
        }

        eq(other: ImageWidget): boolean {
            return (
                other.destination === this.destination && other.alt === this.alt
            );
        }

        get estimatedHeight(): number {
            const known = dimensions.get(this.destination);
            if (!known) return DEFAULT_ESTIMATED_HEIGHT;
            return Math.round(
                known.height * Math.min(1, DEFAULT_COLUMN_WIDTH / known.width),
            );
        }

        toDOM(view: EditorView): HTMLElement {
            const box = document.createElement("div");
            box.className = "cm-image-widget";
            const loading = document.createElement("div");
            loading.className = "cm-image-loading";
            loading.textContent = options.labels.loading;
            box.append(loading);
            const record: Mounted = {
                destination: this.destination,
                resolveCount: 0,
                destroyed: false,
                box,
                shownKey: null,
                view,
                show: () => undefined,
            };
            const alt = () => box.dataset.alt ?? "";
            box.dataset.alt = this.alt;
            record.show = (source) => requestRender(record, alt, source);
            records.set(box, record);
            mounted.add(record);
            this.load(record);
            return box;
        }

        load(record: Mounted) {
            record.resolveCount += 1;
            options.resolve(record.destination).then(
                (source) => record.show(source),
                () =>
                    record.show({
                        kind: "placeholder",
                        label: options.labels.broken,
                    }),
            );
        }

        updateDOM(dom: HTMLElement): boolean {
            const record = records.get(dom);
            if (!record || record.destination !== this.destination)
                return false;
            dom.dataset.alt = this.alt;
            const img = dom.querySelector("img");
            if (img) {
                const parsed = parseImageAlt(this.alt);
                img.alt = parsed.alt;
                applyWidth(img, parsed.width);
            }
            return true;
        }

        destroy(dom: HTMLElement): void {
            const record = records.get(dom);
            if (!record || record.destroyed) return;
            record.destroyed = true;
            mounted.delete(record);
            records.delete(dom);
            for (let count = 0; count < record.resolveCount; count++) {
                options.release(record.destination);
            }
        }
    }

    const records = new WeakMap<HTMLElement, Mounted>();

    function build(state: EditorState): DecorationSet {
        const active = activeLineNumbers(state);
        const out: Range<Decoration>[] = [];
        syntaxTree(state).iterate({
            enter: (node) => {
                if (node.name !== "Image") return;
                const url = node.node.getChild("URL");
                if (!url) return false;
                const destination = state.doc.sliceString(url.from, url.to);
                if (destination.trim() === "") return false;
                const marks = node.node.getChildren("LinkMark");
                const altFrom = marks[0]?.to ?? node.from + 2;
                const altTo = marks[1]?.from ?? altFrom;
                const alt = state.doc.sliceString(altFrom, altTo);
                const line = state.doc.lineAt(node.to);
                out.push(
                    Decoration.widget({
                        widget: new ImageWidget(destination, alt),
                        block: true,
                        side: 1,
                    }).range(line.to),
                );
                const startLine = state.doc.lineAt(node.from);
                if (
                    startLine.number === line.number &&
                    !active.has(line.number)
                ) {
                    out.push(hiddenSource.range(node.from, node.to));
                }
                return false;
            },
        });
        return Decoration.set(out, true);
    }

    const field = StateField.define<DecorationSet>({
        create: (state) => build(state),
        update(value, transaction) {
            if (
                transaction.docChanged ||
                transaction.selection ||
                syntaxTree(transaction.state) !==
                    syntaxTree(transaction.startState)
            ) {
                return build(transaction.state);
            }
            return value;
        },
        provide: (self) => EditorView.decorations.from(self),
    });

    const theme = EditorView.theme({
        ".cm-image-widget": {
            padding: "var(--raw-space-1) 0",
        },
        ".cm-image-frame": {
            position: "relative",
            display: "inline-block",
            maxWidth: "100%",
        },
        ".cm-image-preview": {
            display: "block",
            maxWidth: "100%",
            height: "auto",
        },
        ".cm-image-resize-handle": {
            position: "absolute",
            right: "0",
            bottom: "0",
            width: "12px",
            height: "12px",
            padding: "0",
            border: "1px solid var(--bs-border-control)",
            borderRadius: "2px",
            backgroundColor: "var(--bs-text-link)",
            cursor: "nwse-resize",
            opacity: "0",
            touchAction: "none",
        },
        ".cm-image-frame:hover .cm-image-resize-handle, .cm-image-resize-handle:focus-visible":
            { opacity: "1" },
        ".cm-image-resize-handle:focus-visible": {
            outline: "2px solid var(--bs-text-link)",
            outlineOffset: "2px",
        },
        ".cm-image-loading, .cm-image-placeholder": {
            display: "flex",
            alignItems: "center",
            gap: "var(--raw-space-1)",
            padding: "var(--raw-space-2)",
            border: "1px solid var(--bs-border-divider)",
            borderRadius: "4px",
            color: "var(--bs-text-muted)",
            fontSize: "var(--bs-text-size-ui)",
        },
    });

    return {
        extension: [field, theme],
        refresh() {
            for (const record of [...mounted]) {
                const widget = record;
                widget.resolveCount += 1;
                options.resolve(widget.destination).then(
                    (source) => widget.show(source),
                    () => undefined,
                );
            }
        },
    };
}
