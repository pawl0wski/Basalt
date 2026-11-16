import {
    createAttachments,
    err,
    type Attachments,
    type WorkspaceFileSystem,
    type WorkspacePath,
} from "@basalt/core";
import { addImagesFromFiles, type AddImagesOutcome } from "./add-images";
import { createImageLoader, type ImageLoader } from "./image-loader";

export type NoteImages = {
    readonly loader: ImageLoader;
    subscribe(listener: () => void): () => void;
    activate(): void;
    addFiles(files: readonly File[]): Promise<AddImagesOutcome>;
    dispose(): void;
};

export type ImageHub = {
    setFs(fs: WorkspaceFileSystem | null): void;
    forNote(notePath: WorkspacePath): NoteImages;
    notifyChanged(paths: readonly WorkspacePath[]): void;
    notifyFocus(): Promise<void>;
};

const unavailable = {
    code: "unavailable",
    message: "The workspace is not available.",
} as const;

const detachedAttachments: Attachments = {
    readImage: async () => err(unavailable),
    addImage: async () => err(unavailable),
};

export function createImageHub(now: () => Date = () => new Date()): ImageHub {
    let fs: WorkspaceFileSystem | null = null;
    let attachments: Attachments = detachedAttachments;
    const live = new Set<{
        readonly images: NoteImages;
        readonly listeners: Set<() => void>;
    }>();

    function disposeAll(): void {
        for (const entry of [...live]) entry.images.dispose();
    }

    return {
        setFs(next) {
            disposeAll();
            fs = next;
            attachments = next
                ? createAttachments({ fs: next })
                : detachedAttachments;
        },

        forNote(notePath) {
            const listeners = new Set<() => void>();
            const loader = createImageLoader({
                attachments,
                stat: (path) =>
                    fs ? fs.stat(path) : Promise.resolve(err(unavailable)),
                notePath,
            });
            const entry = {
                listeners,
                images: {
                    loader,
                    subscribe(listener: () => void) {
                        listeners.add(listener);
                        return () => {
                            listeners.delete(listener);
                        };
                    },
                    addFiles(files: readonly File[]) {
                        return addImagesFromFiles({
                            files,
                            notePath,
                            attachments,
                            now,
                        });
                    },
                    activate() {
                        live.add(entry);
                    },
                    dispose() {
                        loader.dispose();
                        live.delete(entry);
                    },
                },
            };
            live.add(entry);
            return entry.images;
        },

        notifyChanged(paths) {
            for (const { images, listeners } of [...live]) {
                if (images.loader.invalidate(paths)) {
                    for (const listener of [...listeners]) listener();
                }
            }
        },

        async notifyFocus() {
            for (const { images, listeners } of [...live]) {
                if (await images.loader.revalidate()) {
                    for (const listener of [...listeners]) listener();
                }
            }
        },
    };
}
