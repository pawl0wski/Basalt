export function noteTitle(path: string): string {
    const fileName = path.split("/").at(-1) ?? path;
    return /\.md$/i.test(fileName)
        ? fileName.slice(0, -".md".length)
        : fileName;
}
