import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basaltTheme } from "./theme";

export type MarkdownEditorOptions = {
    doc: string;
    onChange: (text: string) => void;
    extensions?: Extension[];
    readOnly?: boolean;
    ariaLabel?: string;
};

export type MarkdownEditor = {
    getText: () => string;
    setText: (text: string) => void;
    focus: () => void;
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
    }: MarkdownEditorOptions,
): MarkdownEditor {
    const baseExtensions: Extension[] = [
        markdown(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        basaltTheme,
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
        destroy: () => view.destroy(),
    };
}
