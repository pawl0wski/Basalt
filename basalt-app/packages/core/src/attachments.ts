import { detectImage, exceedsImageLimits, MAX_IMAGE_BYTES } from "./images";
import type { ImageInfo } from "./images";
import type { WorkspaceFileSystem } from "./ports";
import { err, ok, type Result } from "./result";
import type { WorkspacePath } from "./workspace-path";

export interface ReadImageResult {
    readonly bytes: Uint8Array;
    readonly info: ImageInfo;
}

export interface Attachments {
    readImage(path: WorkspacePath): Promise<Result<ReadImageResult>>;
}

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
    };
}
