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
import { activeLineNumbers, type TextRange } from "./livePreview";

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
    altRange: TextRange;
    resizable: boolean;
    cancelDrag?: () => void;
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
        record.cancelDrag?.();
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
        img.addEventListener("load", () => {
            updateResizeValue(img, parseImageAlt(alt()).width);
            record.view.requestMeasure();
        });
        img.addEventListener("error", () => {
            if (record.destroyed) return;
            record.cancelDrag?.();
            record.shownKey = "broken";
            record.box.replaceChildren(placeholder(options.labels.broken));
            record.view.requestMeasure();
        });
        img.src = source.src;
        frame.append(img);
        if (record.resizable && !record.view.state.readOnly)
            frame.append(createHandle(record, img));
        record.box.append(frame);
        applyWidth(img, parseImageAlt(alt()).width);
        record.view.requestMeasure();
    }

    function updateResizeValue(img: HTMLImageElement, width: number | null) {
        const handle = img.nextElementSibling;
        if (!handle) return;
        const value = width ?? img.getBoundingClientRect().width;
        handle.setAttribute("aria-valuenow", String(clampImageWidth(value)));
    }

    function applyWidth(img: HTMLImageElement, width: number | null) {
        img.style.width = width === null ? "" : `${width}px`;
        updateResizeValue(img, width);
    }

    function commitWidth(record: Mounted, width: number | null) {
        const {
            view,
            box,
            altRange: { from, to },
        } = record;
        if (record.destroyed || view.state.readOnly) return;
        const alt = view.state.doc.sliceString(from, to);
        if (alt !== box.dataset.alt) return;
        const insert = formatImageAlt(parseImageAlt(alt).alt, width);
        if (insert === alt) return;
        view.dispatch({
            changes: { from, to, insert },
            userEvent: "input.resize",
            annotations: isolateHistory.of("full"),
        });
    }

    function createHandle(record: Mounted, img: HTMLImageElement): HTMLElement {
        const handle = document.createElement("button");
        handle.type = "button";
        handle.className = "cm-image-resize-handle";
        handle.title = options.labels.resize;
        handle.setAttribute("role", "slider");
        handle.setAttribute("aria-label", options.labels.resize);
        handle.setAttribute("aria-orientation", "horizontal");
        handle.setAttribute("aria-valuemin", String(MIN_IMAGE_WIDTH));
        handle.setAttribute("aria-valuemax", String(MAX_IMAGE_WIDTH));
        const storedWidth = () =>
            parseImageAlt(record.box.dataset.alt ?? "").width;
        const currentWidth = () =>
            storedWidth() ?? Math.round(img.getBoundingClientRect().width);
        let drag: {
            pointerId: number;
            startX: number;
            startWidth: number;
            width: number;
        } | null = null;

        function endDrag() {
            const done = drag;
            if (!done) return;
            drag = null;
            record.cancelDrag = undefined;
            handle.ownerDocument.removeEventListener("keydown", escape, true);
            if (handle.hasPointerCapture?.(done.pointerId)) {
                handle.releasePointerCapture(done.pointerId);
            }
            applyWidth(img, storedWidth());
            return done;
        }

        function escape(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            endDrag();
        }

        handle.addEventListener("pointerdown", (event) => {
            if (event.button !== 0 || drag) return;
            event.preventDefault();
            handle.setPointerCapture?.(event.pointerId);
            const startWidth = Math.round(img.getBoundingClientRect().width);
            drag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startWidth,
                width: startWidth,
            };
            record.cancelDrag = endDrag;
            handle.ownerDocument.addEventListener("keydown", escape, true);
        });
        handle.addEventListener("pointermove", (event) => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            drag.width = clampImageWidth(
                drag.startWidth + event.clientX - drag.startX,
            );
            applyWidth(img, drag.width);
        });
        handle.addEventListener("pointerup", (event) => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            const done = endDrag();
            if (done && done.width !== done.startWidth) {
                commitWidth(record, done.width);
            }
        });
        const cancel = (event: PointerEvent) => {
            if (drag && drag.pointerId === event.pointerId) endDrag();
        };
        handle.addEventListener("pointercancel", cancel);
        handle.addEventListener("lostpointercapture", cancel);
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
            readonly altRange: TextRange,
            readonly resizable: boolean,
            readonly active: boolean,
        ) {
            super();
        }

        eq(other: ImageWidget): boolean {
            return (
                other.destination === this.destination &&
                other.alt === this.alt &&
                other.altRange.from === this.altRange.from &&
                other.altRange.to === this.altRange.to &&
                other.resizable === this.resizable &&
                other.active === this.active
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
            box.classList.toggle("cm-image-active", this.active);
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
                altRange: this.altRange,
                resizable: this.resizable,
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
            if (
                !record ||
                record.destination !== this.destination ||
                record.resizable !== this.resizable
            )
                return false;
            dom.classList.toggle("cm-image-active", this.active);
            dom.dataset.alt = this.alt;
            record.altRange = this.altRange;
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
            record.cancelDrag?.();
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
                const startLine = state.doc.lineAt(node.from);
                const onImage =
                    active.has(line.number) || active.has(startLine.number);
                let parent = node.node.parent;
                while (parent && parent.name !== "Table")
                    parent = parent.parent;
                out.push(
                    Decoration.widget({
                        widget: new ImageWidget(
                            destination,
                            alt,
                            {
                                from: altFrom,
                                to: altTo,
                            },
                            !parent,
                            onImage,
                        ),
                        block: true,
                        side: 1,
                    }).range(line.to),
                );
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
        ".cm-image-frame:hover .cm-image-resize-handle, .cm-image-active .cm-image-resize-handle, .cm-image-resize-handle:focus-visible":
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
        extension: [
            field,
            theme,
            EditorView.updateListener.of((update) => {
                if (!update.docChanged) return;
                for (const record of mounted) record.cancelDrag?.();
            }),
        ],
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
