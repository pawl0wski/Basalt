import { Checkbox, ImagePlaceholder, NoteImage } from "@basalt/ui";
import { ImageOff } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { classifyLines, inlineTokens, resolveImage } from "../model/markdown";
import type { Line } from "../model/markdown";
import type { Files, Tab } from "../model/types";

type EditorProps = {
    tab: Tab;
    files: Files;
    imagesSlow: boolean;
    dragOver: boolean;
    onChange: (text: string) => void;
    onCursor: (line: number) => void;
};

function Inline({ text }: { text: string }) {
    return (
        <>
            {inlineTokens(text).map((token, index) => {
                switch (token.kind) {
                    case "strong":
                        return <strong key={index}>{token.text}</strong>;
                    case "em":
                        return <em key={index}>{token.text}</em>;
                    case "code":
                        return (
                            <code
                                key={index}
                                className="font-code text-size-code"
                            >
                                {token.text}
                            </code>
                        );
                    case "link":
                        return (
                            <span
                                key={index}
                                className="text-text-link underline"
                            >
                                {token.text}
                            </span>
                        );
                    default:
                        return <span key={index}>{token.text}</span>;
                }
            })}
        </>
    );
}

function imageOf(line: Line) {
    return line.kind === "image" ? line : null;
}

function BrokenImage() {
    return (
        <div
            data-gap="DSG-07"
            data-problem="broken"
            className="bs-image-placeholder flex min-h-activity-bar items-center gap-between-groups rounded-container border border-border-divider bg-surface-card p-panel text-size-ui text-text-muted"
        >
            <ImageOff
                aria-hidden="true"
                className="size-icon shrink-0 text-icon-default"
            />
            <span className="break-words">Image could not be displayed</span>
        </div>
    );
}

function ImageBlock({
    files,
    notePath,
    destination,
    alt,
    slow,
}: {
    files: Files;
    notePath: string;
    destination: string;
    alt: string;
    slow: boolean;
}) {
    const view = resolveImage(files, notePath, destination);
    if (view.kind === "image" && slow)
        return (
            <div data-gap="DSG-07">
                <ImagePlaceholder problem="loading" />
            </div>
        );
    if (view.kind === "image")
        return (
            <NoteImage
                src={view.entry.src ?? ""}
                alt={alt}
                width={view.entry.width}
                height={view.entry.height}
            />
        );
    if (view.problem === "broken") return <BrokenImage />;
    return <ImagePlaceholder problem={view.problem} path={view.path} />;
}

function Rendered({
    line,
    text,
    files,
    notePath,
    imagesSlow,
    onToggleTask,
}: {
    line: Line;
    text: string;
    files: Files;
    notePath: string;
    imagesSlow: boolean;
    onToggleTask: (checked: boolean) => void;
}): ReactNode {
    switch (line.kind) {
        case "blank":
            return <div aria-hidden="true" className="h-between-groups" />;
        case "heading": {
            if (line.level === 1)
                return (
                    <h2 className="text-size-note-h1 text-text-note">
                        <Inline text={line.text} />
                    </h2>
                );
            if (line.level === 2)
                return (
                    <h3 className="text-size-note-h2 text-text-note">
                        <Inline text={line.text} />
                    </h3>
                );
            return (
                <h4 className="text-size-note-h3 text-text-note">
                    <Inline text={line.text} />
                </h4>
            );
        }
        case "task":
            return (
                <Checkbox
                    label={<Inline text={line.text} />}
                    checked={line.checked}
                    onCheckedChange={(checked) =>
                        onToggleTask(checked === true)
                    }
                    onClick={(event) => event.stopPropagation()}
                />
            );
        case "bullet":
            return (
                <div className="flex gap-in-group text-size-note text-text-note">
                    <span aria-hidden="true">•</span>
                    <span>
                        <Inline text={line.text} />
                    </span>
                </div>
            );
        case "quote":
            return (
                <div className="border-l border-border-control pl-between-groups text-size-note text-text-muted">
                    <Inline text={line.text} />
                </div>
            );
        case "fence":
            return (
                <div
                    aria-hidden="true"
                    className="h-in-group rounded-control bg-code-block-bg"
                />
            );
        case "code":
            return (
                <div className="bg-code-block-bg px-panel font-code text-size-code text-text-ui">
                    {text || " "}
                </div>
            );
        case "image":
            return (
                <div className="flex flex-col gap-in-group">
                    <p className="font-code text-size-code text-text-muted">
                        {text}
                    </p>
                    <ImageBlock
                        files={files}
                        notePath={notePath}
                        destination={line.destination}
                        alt={line.alt}
                        slow={imagesSlow}
                    />
                </div>
            );
        case "paragraph":
            return (
                <p className="text-size-note text-text-note">
                    <Inline text={line.text} />
                </p>
            );
    }
}

function sourceClass(line: Line) {
    const base =
        "w-full bg-transparent px-in-group text-text-note caret-current outline-none";
    if (line.kind === "heading")
        return `${base} ${
            line.level === 1
                ? "text-size-note-h1"
                : line.level === 2
                  ? "text-size-note-h2"
                  : "text-size-note-h3"
        }`;
    if (line.kind === "code" || line.kind === "fence")
        return `${base} font-code text-size-code`;
    return `${base} text-size-note`;
}

function Editor({
    tab,
    files,
    imagesSlow,
    dragOver,
    onChange,
    onCursor,
}: EditorProps) {
    const lines = tab.text.split("\n");
    const [active, setActive] = useState(
        Math.min(tab.cursor, lines.length - 1),
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingFocus = useRef(false);
    const activeLine = Math.min(active, lines.length - 1);
    const classified = classifyLines(lines);

    useEffect(() => {
        if (tab.text === "") inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (pendingFocus.current) {
            pendingFocus.current = false;
            inputRef.current?.focus();
        }
    });

    const activate = (index: number) => {
        pendingFocus.current = true;
        setActive(index);
        onCursor(index);
    };

    const activateUnlessCommenting = (index: number) => {
        if (!document.body.classList.contains("proto-comment")) activate(index);
    };

    const replace = (index: number, value: string) => {
        const next = [...lines];
        next[index] = value;
        onChange(next.join("\n"));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        if (event.key === "Enter") {
            event.preventDefault();
            const at = input.selectionStart ?? input.value.length;
            const next = [...lines];
            next.splice(
                activeLine,
                1,
                input.value.slice(0, at),
                input.value.slice(at),
            );
            onChange(next.join("\n"));
            activate(activeLine + 1);
        } else if (
            event.key === "Backspace" &&
            input.selectionStart === 0 &&
            input.selectionEnd === 0 &&
            activeLine > 0
        ) {
            event.preventDefault();
            const next = [...lines];
            next.splice(
                activeLine - 1,
                2,
                lines[activeLine - 1] + lines[activeLine],
            );
            onChange(next.join("\n"));
            activate(activeLine - 1);
        } else if (event.key === "ArrowUp" && activeLine > 0) {
            event.preventDefault();
            activate(activeLine - 1);
        } else if (event.key === "ArrowDown" && activeLine < lines.length - 1) {
            event.preventDefault();
            activate(activeLine + 1);
        }
    };

    return (
        <div
            data-gap="DSG-01"
            className="mx-auto flex w-full max-w-note flex-col gap-in-group px-note-x py-section"
        >
            {lines.flatMap((text, index) => [
                dragOver && index === activeLine + 1 ? (
                    <div
                        key={`caret-${index}`}
                        role="presentation"
                        data-drop-caret=""
                        className="h-in-group rounded-control bg-action-primary"
                    />
                ) : null,
                index === activeLine ? (
                    <div key={index} className="flex flex-col gap-in-group">
                        <input
                            ref={inputRef}
                            value={text}
                            aria-label={`Markdown line ${index + 1}`}
                            onChange={(event) =>
                                replace(index, event.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            className={sourceClass(classified[index])}
                        />
                        {imageOf(classified[index]) ? (
                            <ImageBlock
                                files={files}
                                notePath={tab.path}
                                destination={
                                    imageOf(classified[index])!.destination
                                }
                                alt={imageOf(classified[index])!.alt}
                                slow={imagesSlow}
                            />
                        ) : null}
                    </div>
                ) : (
                    <div
                        key={index}
                        tabIndex={0}
                        onFocus={(event) => {
                            if (event.target === event.currentTarget)
                                activateUnlessCommenting(index);
                        }}
                        onClick={() => activateUnlessCommenting(index)}
                        className="rounded-control px-in-group focus-visible:focus-ring"
                    >
                        <Rendered
                            line={classified[index]}
                            text={text}
                            files={files}
                            notePath={tab.path}
                            imagesSlow={imagesSlow}
                            onToggleTask={(checked) =>
                                replace(
                                    index,
                                    text.replace(
                                        /^- \[( |x)\]/i,
                                        checked ? "- [x]" : "- [ ]",
                                    ),
                                )
                            }
                        />
                    </div>
                ),
            ])}
            {dragOver && activeLine === lines.length - 1 ? (
                <div
                    role="presentation"
                    data-drop-caret=""
                    className="h-in-group rounded-control bg-action-primary"
                />
            ) : null}
        </div>
    );
}

export { Editor };
