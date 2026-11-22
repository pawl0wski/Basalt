import {
    createMarkdownEditor,
    type FileInputOptions,
    type ImageOptions,
    type MarkdownEditor,
} from "@basalt/editor";
import { useEffect, useRef } from "react";
import { createTitleTracker } from "./title-tracker";

export type NoteEditorProps = {
    label: string;
    text: string;
    onChange: (text: string) => void;
    focusRequest?: number;
    focusPosition?: number | null;
    onTitleLeave?: () => void;
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
    focusPosition = null,
    onTitleLeave,
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
    const focusPositionRef = useRef(focusPosition);
    const onTitleLeaveRef = useRef(onTitleLeave);
    const labelRef = useRef(label);
    const imagesRef = useRef(images);
    const filesRef = useRef(files);

    useEffect(() => {
        onChangeRef.current = onChange;
        textRef.current = text;
        focusRef.current = focusRequest;
        focusPositionRef.current = focusPosition;
        onTitleLeaveRef.current = onTitleLeave;
        labelRef.current = label;
        imagesRef.current = images;
        filesRef.current = files;
    });

    useEffect(() => {
        const parent = parentRef.current;
        if (!parent) return;
        const tracker = createTitleTracker(() => {
            onTitleLeaveRef.current?.();
        });
        const editor = createMarkdownEditor(parent, {
            doc: textRef.current,
            onChange: (next) => {
                knownText.current = next;
                onChangeRef.current(next);
            },
            readOnly,
            ariaLabel: labelRef.current,
            onSelectionChange: (selection) => {
                const current = editorRef.current;
                if (current) tracker.update(current.getText(), selection);
            },
            onBlur: () => {
                tracker.blur();
            },
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
        if (focusRef.current > 0)
            editor.focus(focusPositionRef.current ?? undefined);
        return () => {
            unsubscribe?.();
            editor.destroy();
            editorRef.current = null;
        };
    }, [readOnly]);

    useEffect(() => {
        editorRef.current?.setLabel(label);
    }, [label]);

    useEffect(() => {
        if (text === knownText.current) return;
        knownText.current = text;
        editorRef.current?.setText(text);
    }, [text]);

    useEffect(() => {
        if (focusRequest > 0)
            editorRef.current?.focus(focusPositionRef.current ?? undefined);
    }, [focusRequest]);

    return <div ref={parentRef} className="min-h-none flex-1" />;
}
