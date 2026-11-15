import {
    createMarkdownEditor,
    type ImageOptions,
    type MarkdownEditor,
} from "@basalt/editor";
import { useEffect, useRef } from "react";

export type NoteEditorProps = {
    label: string;
    text: string;
    onChange: (text: string) => void;
    focusRequest?: number;
    readOnly?: boolean;
    images?: NoteEditorImages;
};

export type NoteEditorImages = {
    options: ImageOptions;
    subscribe(listener: () => void): () => void;
};

export function NoteEditor({
    label,
    text,
    onChange,
    focusRequest = 0,
    readOnly = false,
    images,
}: NoteEditorProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MarkdownEditor | null>(null);
    const knownText = useRef(text);
    const onChangeRef = useRef(onChange);
    const textRef = useRef(text);
    const focusRef = useRef(focusRequest);
    const imagesRef = useRef(images);

    useEffect(() => {
        onChangeRef.current = onChange;
        textRef.current = text;
        focusRef.current = focusRequest;
        imagesRef.current = images;
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
            images: imagesRef.current?.options,
        });
        const unsubscribe = imagesRef.current?.subscribe(() => {
            editor.refreshImages();
        });
        knownText.current = textRef.current;
        editorRef.current = editor;
        if (focusRef.current > 0) editor.focus();
        return () => {
            unsubscribe?.();
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
