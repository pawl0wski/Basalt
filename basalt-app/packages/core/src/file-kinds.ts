export type FileKindId = "markdown" | "image";

export interface FileKindDefinition<Id extends string = FileKindId> {
    readonly id: Id;
    readonly extensions: readonly string[];
}

export const FILE_KINDS: readonly FileKindDefinition[] = [
    { id: "markdown", extensions: [".md"] },
    {
        id: "image",
        extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"],
    },
];

export function fileKindOf<Id extends string = FileKindId>(
    path: string,
    kinds: readonly FileKindDefinition<Id>[] = FILE_KINDS as readonly FileKindDefinition<Id>[],
): Id | null {
    const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
    let best: { id: Id; length: number } | null = null;
    for (const kind of kinds) {
        for (const extension of kind.extensions) {
            if (
                name.endsWith(extension) &&
                (best === null || extension.length > best.length)
            ) {
                best = { id: kind.id, length: extension.length };
            }
        }
    }
    return best === null ? null : best.id;
}
