export function folderName(root: string): string {
    const segments = root.split(/[\\/]/).filter((segment) => segment !== "");
    return segments.at(-1) ?? root;
}
