import {
    DEFAULT_ATTACHMENT_LOCATION,
    attachmentFolderFor,
    type AttachmentLocation,
} from "./attachment-location";
import { planAttachmentName, splitFileName } from "./attachment-names";
import { detectImage, exceedsImageLimits, MAX_IMAGE_BYTES } from "./images";
import { buildRelativeLink, formatImageLink } from "./links";
import type { ImageInfo } from "./images";
import type { WorkspaceFileSystem } from "./ports";
import { err, ok, type Result } from "./result";
import { pathKey, toWorkspacePath, type WorkspacePath } from "./workspace-path";

export interface ReadImageResult {
    readonly bytes: Uint8Array;
    readonly info: ImageInfo;
}

export interface AddImageInput {
    readonly notePath: WorkspacePath;
    readonly bytes: Uint8Array;
    readonly originalName: string | null;
    readonly now: Date;
    readonly location?: AttachmentLocation;
}

export interface AddImageResult {
    readonly path: WorkspacePath;
    readonly linkText: string;
}

export interface Attachments {
    readImage(path: WorkspacePath): Promise<Result<ReadImageResult>>;
    addImage(input: AddImageInput): Promise<Result<AddImageResult>>;
}

const MAX_NAME_ATTEMPTS = 5;

export function createAttachments({
    fs,
}: {
    fs: WorkspaceFileSystem;
}): Attachments {
    return {
        async readImage(path) {
            const stat = await fs.stat(path);
            if (!stat.ok) return stat;
            if (stat.value.kind !== "file") {
                return err({
                    code: "invalid-path",
                    message: "The entry is not a regular file.",
                });
            }
            if (stat.value.size > MAX_IMAGE_BYTES) {
                return err({
                    code: "too-large",
                    message: "The image is too large.",
                });
            }
            const bytes = await fs.readBytes(path);
            if (!bytes.ok) return bytes;
            const info = detectImage(bytes.value);
            if (info === null) {
                return err({
                    code: "unsupported",
                    message: "The image format is not supported.",
                });
            }
            if (exceedsImageLimits(bytes.value.length, info)) {
                return err({
                    code: "too-large",
                    message: "The image is too large.",
                });
            }
            return ok({ bytes: bytes.value, info });
        },

        async addImage(input) {
            const { notePath, bytes, originalName, now } = input;
            const location = input.location ?? DEFAULT_ATTACHMENT_LOCATION;
            if (bytes.length > MAX_IMAGE_BYTES) return tooLarge();
            const info = detectImage(bytes);
            if (info === null) {
                return err({
                    code: "unsupported",
                    message: "The image format is not supported.",
                });
            }
            if (exceedsImageLimits(bytes.length, info)) return tooLarge();

            const folder = attachmentFolderFor(notePath, location);
            let taken = new Set<string>();
            if (folder !== null) {
                const stat = await fs.stat(folder);
                if (stat.ok) {
                    if (stat.value.kind !== "directory") {
                        return err({
                            code: "invalid-path",
                            message: "The attachment folder is not a folder.",
                        });
                    }
                } else if (stat.error.code === "not-found") {
                    const made = await fs.mkdir(folder);
                    if (!made.ok) return made;
                } else {
                    return stat;
                }
                const listed = await fs.readDir(folder);
                if (listed.ok) {
                    taken = new Set(
                        listed.value.map((entry) =>
                            pathKey(
                                entry.path.slice(
                                    entry.path.lastIndexOf("/") + 1,
                                ) as WorkspacePath,
                            ),
                        ),
                    );
                } else if (listed.error.code !== "not-found") {
                    return listed;
                }
            }

            for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
                const name = planAttachmentName({
                    originalName,
                    format: info.format,
                    now,
                    taken,
                });
                const target = toWorkspacePath(
                    folder === null ? name : `${folder}/${name}`,
                );
                if (!target.ok) return target;
                const written = await fs.createExclusive(target.value, bytes);
                if (written.ok) {
                    const { stem } = splitFileName(name);
                    return ok({
                        path: target.value,
                        linkText: formatImageLink(
                            stem,
                            buildRelativeLink(notePath, target.value),
                        ),
                    });
                }
                if (written.error.code !== "already-exists") return written;
                taken = new Set(taken).add(pathKey(name as WorkspacePath));
            }
            return err({
                code: "already-exists",
                message: "No free attachment name was found.",
            });
        },
    };

    function tooLarge(): Result<never> {
        return err({ code: "too-large", message: "The image is too large." });
    }
}
