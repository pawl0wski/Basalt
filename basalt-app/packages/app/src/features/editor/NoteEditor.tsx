import { createMarkdownEditor, type MarkdownEditor } from "@basalt/editor";
import { useEffect, useRef } from "react";

export type NoteEditorProps = {
    label: string;
    text: string;
    onChange: (text: string) => void;
    focusRequest?: number;
    readOnly?: boolean;
};

export function NoteEditor({
    label,
    text,
    onChange,
    focusRequest = 0,
    readOnly = false,
}: NoteEditorProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MarkdownEditor | null>(null);
    const knownText = useRef(text);
    const onChangeRef = useRef(onChange);
    const textRef = useRef(text);
    const focusRef = useRef(focusRequest);

    useEffect(() => {
        onChangeRef.current = onChange;
        textRef.current = text;
        focusRef.current = focusRequest;
    });

    useEffect(() => {
        const parent = parentRef.current;
        if (!parent) return;
        const editor = createMarkdownEditor(parent, {
            doc: textRef.current,
            onChange: (next) => {
                knownText.current = next;
                onChangeRef.current(next);
            },
            readOnly,
            ariaLabel: label,
        });
        knownText.current = textRef.current;
        editorRef.current = editor;
        if (focusRef.current > 0) editor.focus();
        return () => {
            editor.destroy();
            editorRef.current = null;
        };
    }, [label, readOnly]);

    useEffect(() => {
        if (text === knownText.current) return;
        knownText.current = text;
        editorRef.current?.setText(text);
    }, [text]);

    useEffect(() => {
        if (focusRequest > 0) editorRef.current?.focus();
    }, [focusRequest]);

    return <div ref={parentRef} className="min-h-full" />;
}
