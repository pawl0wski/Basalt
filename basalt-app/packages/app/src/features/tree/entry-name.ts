import {
    pathKey,
    validateNoteName,
    type NoteNameIssue,
    type TreeNode,
    type WorkspacePath,
} from "@basalt/core";

export type EntryNameProblem = NoteNameIssue | "leading-dot" | "collision";

export type EntryNameCheck = {
    readonly name: string;
    readonly kind: "note" | "folder";
    readonly parent: WorkspacePath | null;
    readonly siblings: readonly TreeNode[];
    readonly own?: WorkspacePath;
};

const EXTENSION = ".md";

export function validateEntryName(
    check: EntryNameCheck,
): EntryNameProblem | null {
    const { name, kind, parent, siblings, own } = check;
    if (name === "") return null;
    const base = validateNoteName(name);
    if (!base.valid) return base.reason;
    if (name.startsWith(".")) return "leading-dot";
    const fileName = kind === "note" ? name + EXTENSION : name;
    const full = validateNoteName(fileName);
    if (!full.valid) return full.reason;
    const key = pathKey(
        ((parent === null ? "" : `${parent}/`) + fileName) as WorkspacePath,
    );
    const collides = siblings.some(
        (sibling) => sibling.path !== own && pathKey(sibling.path) === key,
    );
    return collides ? "collision" : null;
}
