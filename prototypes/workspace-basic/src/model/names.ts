const INVALID_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f]/;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const MAX_BYTES = 255;

export function nameKey(name: string) {
    return name.normalize("NFC").toLowerCase();
}

export function stripExtension(fileName: string) {
    return fileName.replace(/\.md$/i, "");
}

export function baseName(path: string) {
    return path.slice(path.lastIndexOf("/") + 1);
}

export function folderOf(path: string) {
    const slash = path.lastIndexOf("/");
    return slash === -1 ? "" : path.slice(0, slash);
}

export function joinPath(folder: string, name: string) {
    return folder ? `${folder}/${name}` : name;
}

export function noteName(path: string) {
    return stripExtension(baseName(path));
}

export function validateName(
    raw: string,
    taken: string[],
    kind: "note" | "folder",
): string | undefined {
    const label = kind === "note" ? "note" : "folder";
    const name = raw.trim();
    if (name === "") return `Enter a name for the ${label}.`;
    if (INVALID_CHARACTERS.test(name))
        return 'Names cannot contain / \\ : * ? " < > |';
    if (name === "." || name === ".." || /[. ]$/.test(raw))
        return "Names cannot be . or .. and cannot end with a dot or a space.";
    if (RESERVED.test(name))
        return "This name is reserved by the operating system.";
    const extra = kind === "note" ? ".md" : "";
    if (new TextEncoder().encode(name + extra).length > MAX_BYTES)
        return "Names can be at most 255 bytes long.";
    if (taken.some((other) => nameKey(other) === nameKey(name)))
        return `A ${label} with this name already exists.`;
    return undefined;
}

export function suggestNoteName(taken: string[]) {
    const keys = new Set(taken.map(nameKey));
    if (!keys.has(nameKey("Untitled"))) return "Untitled";
    for (let index = 1; ; index += 1) {
        const candidate = `Untitled ${index}`;
        if (!keys.has(nameKey(candidate))) return candidate;
    }
}
