import { EditorView } from "@codemirror/view";

export const basaltTheme = EditorView.theme({
    "&": {
        color: "var(--bs-text-note)",
        backgroundColor: "var(--bs-surface-editor)",
        fontFamily: "var(--bs-font-text)",
        fontSize: "var(--bs-text-size-note)",
    },
    "&.cm-focused": {
        outline: "none",
    },
    ".cm-scroller": {
        fontFamily: "inherit",
        lineHeight: "var(--bs-text-size-note-line-height)",
    },
    ".cm-content": {
        caretColor: "var(--bs-text-note)",
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--bs-text-note)",
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
        {
            backgroundColor: "var(--bs-editor-selection)",
        },
    ".cm-line": {
        padding: "0",
    },
});
