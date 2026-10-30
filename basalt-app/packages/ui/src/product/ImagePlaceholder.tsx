import { ImageOff, LoaderCircle } from "lucide-react";
import { cn } from "../lib/utils";

const texts = {
    loading: "Loading image",
    "not-found": "Image not found",
    unreadable: "Image could not be read",
    unsupported: "Format not supported",
    "too-large": "Image is too large (over 20 MiB or 100 megapixels)",
    remote: "Remote images are not loaded",
    invalid: "Invalid image link",
} as const;

type ImageProblem = keyof typeof texts;

type ImagePlaceholderProps = {
    problem: ImageProblem;
    path?: string;
    className?: string;
};

function ImagePlaceholder({ problem, path, className }: ImagePlaceholderProps) {
    const text = problem === "not-found" && path ? `${texts[problem]}: ${path}` : texts[problem];
    const Icon = problem === "loading" ? LoaderCircle : ImageOff;

    return (
        <div
            data-problem={problem}
            className={cn(
                "bs-image-placeholder flex min-h-activity-bar items-center gap-between-groups rounded-container border border-border-divider bg-surface-card p-panel text-size-ui text-text-muted",
                className,
            )}
        >
            <Icon aria-hidden="true" className="size-icon shrink-0 text-icon-default" />
            <span className="break-words">{text}</span>
        </div>
    );
}

type NoteImageProps = {
    src: string;
    alt: string;
    width?: number;
    height?: number;
};

function NoteImage({ src, alt, width, height }: NoteImageProps) {
    return (
        <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="bs-note-image block h-auto max-w-full rounded-control border border-border-divider"
            style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
        />
    );
}

export { ImagePlaceholder, NoteImage };
export type { ImagePlaceholderProps, ImageProblem, NoteImageProps };
