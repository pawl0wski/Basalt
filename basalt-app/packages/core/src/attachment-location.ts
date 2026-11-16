import type { WorkspacePath } from "./workspace-path";
import { toWorkspacePath } from "./workspace-path";

export type AttachmentLocation = {
    readonly kind: "workspace-folder";
    readonly folder: WorkspacePath;
};

const defaultFolder = toWorkspacePath("attachments");
if (!defaultFolder.ok)
    throw new Error("The default attachment folder is invalid.");

export const DEFAULT_ATTACHMENT_LOCATION: AttachmentLocation = {
    kind: "workspace-folder",
    folder: defaultFolder.value,
};

export function attachmentFolderFor(
    _notePath: WorkspacePath,
    location: AttachmentLocation,
): WorkspacePath | null {
    return location.folder;
}
