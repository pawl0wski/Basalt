import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, dropCursor, keymap } from "@codemirror/view";
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
    images?: ImageOptions;
    files?: FileInputOptions;
};

export type MarkdownEditor = {
    getText: () => string;
    setText: (text: string) => void;
    focus: () => void;
    refreshImages: () => void;
    destroy: () => void;
};

export function createMarkdownEditor(
    parent: HTMLElement,
    {
        doc,
        onChange,
        extensions = [],
        readOnly = false,
        ariaLabel,
        images,
        files,
    }: MarkdownEditorOptions,
): MarkdownEditor {
    const imagePreview = images ? createImagePreview(images) : null;
    const baseExtensions: Extension[] = [
        markdown({ base: markdownLanguage }),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        basaltTheme,
        livePreview,
        ...(imagePreview ? [imagePreview.extension] : []),
        ...(files ? [createFileInput(files), dropCursor()] : []),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString());
        }),
        ...(ariaLabel
            ? [EditorView.contentAttributes.of({ "aria-label": ariaLabel })]
            : []),
        ...(readOnly
            ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
            : []),
        ...extensions,
    ];

    const view = new EditorView({
        parent,
        state: EditorState.create({
            doc,
            extensions: baseExtensions,
        }),
    });

    return {
        getText: () => view.state.doc.toString(),
        setText: (text) => {
            if (text === view.state.doc.toString()) return;
            const { anchor, head } = view.state.selection.main;
            const clamp = (position: number) => Math.min(position, text.length);
            view.setState(
                EditorState.create({
                    doc: text,
                    selection: { anchor: clamp(anchor), head: clamp(head) },
                    extensions: baseExtensions,
                }),
            );
        },
        focus: () => view.focus(),
        refreshImages: () => imagePreview?.refresh(),
        destroy: () => view.destroy(),
    };
}
