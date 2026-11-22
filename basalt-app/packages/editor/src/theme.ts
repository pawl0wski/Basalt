import { EditorView } from "@codemirror/view";

export const basaltTheme = EditorView.theme({
    "&": {
        color: "var(--bs-text-note)",
        backgroundColor: "var(--bs-surface-editor)",
        fontFamily: "var(--bs-font-text)",
        fontSize: "var(--bs-text-size-note)",
        height: "100%",
    },
    "&.cm-focused": {
        outline: "none",
    },
    ".cm-scroller": {
        fontFamily: "inherit",
        lineHeight: "var(--bs-text-size-note-line-height)",
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "var(--bs-scrollbar-thumb) var(--bs-scrollbar-track)",
    },
    ".cm-content": {
        caretColor: "var(--bs-text-note)",
        minHeight: "100%",
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
