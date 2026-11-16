import {
    createMarkdownEditor,
    type FileInputOptions,
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
    files?: FileInputOptions;
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
    files,
}: NoteEditorProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MarkdownEditor | null>(null);
    const knownText = useRef(text);
    const onChangeRef = useRef(onChange);
    const textRef = useRef(text);
    const focusRef = useRef(focusRequest);
    const imagesRef = useRef(images);
    const filesRef = useRef(files);

    useEffect(() => {
        onChangeRef.current = onChange;
        textRef.current = text;
        focusRef.current = focusRequest;
        imagesRef.current = images;
        filesRef.current = files;
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
            files: filesRef.current
                ? {
                      onFiles: (dropped, source) =>
                          filesRef.current?.onFiles(dropped, source) ??
                          Promise.resolve([]),
                  }
                : undefined,
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
