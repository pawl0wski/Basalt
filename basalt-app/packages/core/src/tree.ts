import type { FileEntry } from "./ports";
import { isMarkdownPath } from "./notes";
import type { WorkspacePath } from "./workspace-path";

export type TreeNode = FolderNode | NoteNode;

export interface FolderNode {
    readonly kind: "folder";
    readonly name: string;
    readonly path: WorkspacePath;
    readonly children: readonly TreeNode[];
}

export interface NoteNode {
    readonly kind: "note";
    readonly name: string;
    readonly path: WorkspacePath;
}

export const HIDDEN_ROOT_FOLDERS: readonly string[] = ["attachments"];

const MARKDOWN_SUFFIX = /\.md$/i;
const collator = new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
});

interface MutableFolder {
    readonly path: WorkspacePath;
    readonly name: string;
    readonly folders: Map<string, MutableFolder>;
    readonly notes: NoteNode[];
}

function compareNames(a: string, b: string): number {
    const order = collator.compare(a, b);
    if (order !== 0) return order;
    return a < b ? -1 : a > b ? 1 : 0;
}

function isHidden(segments: readonly string[]): boolean {
    if (segments.some((segment) => segment.startsWith("."))) return true;
    const first = segments[0];
    return first !== undefined && HIDDEN_ROOT_FOLDERS.includes(first);
}

function createFolder(path: string, name: string): MutableFolder {
    return {
        path: path as WorkspacePath,
        name,
        folders: new Map(),
        notes: [],
    };
}

function seal(folder: MutableFolder): readonly TreeNode[] {
    const folders: FolderNode[] = [...folder.folders.values()]
        .sort((a, b) => compareNames(a.name, b.name))
        .map((child) => ({
            kind: "folder",
            name: child.name,
            path: child.path,
            children: seal(child),
        }));
    const notes = [...folder.notes].sort((a, b) =>
        compareNames(a.name, b.name),
    );
    return [...folders, ...notes];
}

export function buildTree(entries: readonly FileEntry[]): readonly TreeNode[] {
    const root = createFolder("", "");

    function folderAt(segments: readonly string[]): MutableFolder {
        let current = root;
        segments.forEach((segment, index) => {
            let next = current.folders.get(segment);
            if (!next) {
                next = createFolder(
                    segments.slice(0, index + 1).join("/"),
                    segment,
                );
                current.folders.set(segment, next);
            }
            current = next;
        });
        return current;
    }

    for (const entry of entries) {
        const segments = entry.path.split("/");
        if (isHidden(segments)) continue;
        if (entry.kind === "directory") {
            folderAt(segments);
        } else if (entry.kind === "file" && isMarkdownPath(entry.path)) {
            const fileName = segments[segments.length - 1] ?? "";
            folderAt(segments.slice(0, -1)).notes.push({
                kind: "note",
                name: fileName.replace(MARKDOWN_SUFFIX, ""),
                path: entry.path,
            });
        }
    }
    return seal(root);
}
