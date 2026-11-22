import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, dropCursor, keymap } from "@codemirror/view";
import { emphasisKeymap } from "./formatting";
import { createFileInput, type FileInputOptions } from "./fileInput";
import { createImagePreview, type ImageOptions } from "./imagePreview";
import { livePreview } from "./livePreview";
import { basaltTheme } from "./theme";

export type MarkdownEditorOptions = {
    doc: string;
    onChange: (text: string) => void;
    extensions?: Extension[];
    readOnly?: boolean;
    ariaLabel?: string;
    onSelectionChange?: (selection: { from: number; to: number }) => void;
    onBlur?: () => void;
    images?: ImageOptions;
    files?: FileInputOptions;
};

export type MarkdownEditor = {
    getText: () => string;
    setText: (text: string) => void;
    focus: (position?: number) => void;
    setLabel: (label: string) => void;
    refreshImages: () => void;
    destroy: () => void;
};

function positionMapper(
    previous: string,
    next: string,
): (position: number) => number {
    const limit = Math.min(previous.length, next.length);
    let prefix = 0;
    while (prefix < limit && previous[prefix] === next[prefix]) prefix += 1;
    let suffix = 0;
    while (
        suffix < limit - prefix &&
        previous[previous.length - 1 - suffix] ===
            next[next.length - 1 - suffix]
    ) {
        suffix += 1;
    }
    const delta = next.length - previous.length;
    return (position) => {
        if (position <= prefix) return Math.min(position, next.length);
        if (position >= previous.length - suffix) {
            return Math.max(0, Math.min(position + delta, next.length));
        }
        return next.length - suffix;
    };
}

export function createMarkdownEditor(
    parent: HTMLElement,
    {
        doc,
        onChange,
        extensions = [],
        readOnly = false,
        ariaLabel,
        onSelectionChange,
        onBlur,
        images,
        files,
    }: MarkdownEditorOptions,
): MarkdownEditor {
    const imagePreview = images ? createImagePreview(images) : null;
    const labelCompartment = new Compartment();
    let currentLabel = ariaLabel;
    const labelExtension = (label: string | undefined): Extension =>
        label ? EditorView.contentAttributes.of({ "aria-label": label }) : [];
    const buildExtensions = (): Extension[] => [
        markdown({ base: markdownLanguage }),
        history(),
        keymap.of([...emphasisKeymap, ...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        basaltTheme,
        livePreview,
        ...(imagePreview ? [imagePreview.extension] : []),
        ...(files ? [createFileInput(files), dropCursor()] : []),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString());
            if (
                onSelectionChange &&
                (update.selectionSet || update.docChanged)
            ) {
                const { from, to } = update.state.selection.main;
                onSelectionChange({ from, to });
            }
        }),
        ...(onBlur
            ? [
                  EditorView.domEventHandlers({
                      blur: () => {
                          onBlur();
                      },
                  }),
              ]
            : []),
        labelCompartment.of(labelExtension(currentLabel)),
        ...(readOnly
            ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
            : []),
        ...extensions,
    ];

    const view = new EditorView({
        parent,
        state: EditorState.create({
            doc,
            extensions: buildExtensions(),
        }),
    });

    return {
        getText: () => view.state.doc.toString(),
        setText: (text) => {
            const previous = view.state.doc.toString();
            if (text === previous) return;
            const { anchor, head } = view.state.selection.main;
            const map = positionMapper(previous, text);
            view.setState(
                EditorState.create({
                    doc: text,
                    selection: { anchor: map(anchor), head: map(head) },
                    extensions: buildExtensions(),
                }),
            );
        },
        focus: (position) => {
            if (position !== undefined) {
                const anchor = Math.max(
                    0,
                    Math.min(position, view.state.doc.length),
                );
                view.dispatch({ selection: { anchor }, scrollIntoView: true });
            }
            view.focus();
        },
        setLabel: (label) => {
            currentLabel = label;
            view.dispatch({
                effects: labelCompartment.reconfigure(labelExtension(label)),
            });
        },
        refreshImages: () => imagePreview?.refresh(),
        destroy: () => view.destroy(),
    };
}
