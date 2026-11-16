import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

export type LinkTarget =
    | { readonly kind: "workspace"; readonly path: WorkspacePath }
    | { readonly kind: "remote" }
    | { readonly kind: "unsupported-scheme" }
    | { readonly kind: "invalid" };

const SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):/;
const UNSAFE_SEGMENT = /[/\\\p{Cc}]/u;
const INVALID: LinkTarget = { kind: "invalid" };

function stripDestination(raw: string): string {
    let destination = raw.trim();
    if (destination.startsWith("<") && destination.endsWith(">")) {
        destination = destination.slice(1, -1);
    }
    const cut = destination.search(/[#?]/);
    return cut >= 0 ? destination.slice(0, cut) : destination;
}

function decodeSegment(segment: string): string | null {
    let decoded: string;
    try {
        decoded = decodeURIComponent(segment);
    } catch {
        return null;
    }
    if (decoded === "." || decoded === "..") return null;
    if (UNSAFE_SEGMENT.test(decoded)) return null;
    return decoded;
}

export function resolveLinkTarget(
    notePath: WorkspacePath,
    rawDestination: string,
): LinkTarget {
    const destination = stripDestination(rawDestination);
    if (destination === "") return INVALID;
    const scheme = SCHEME.exec(destination);
    if (scheme) {
        const name = (scheme[1] ?? "").toLowerCase();
        return name === "http" || name === "https"
            ? { kind: "remote" }
            : { kind: "unsupported-scheme" };
    }
    if (destination.startsWith("/") || destination.includes("\\")) {
        return INVALID;
    }
    const resolved = notePath.split("/").slice(0, -1);
    for (const segment of destination.split("/")) {
        if (segment === "") return INVALID;
        if (segment === ".") continue;
        if (segment === "..") {
            if (resolved.length === 0) return INVALID;
            resolved.pop();
            continue;
        }
        resolved.push(segment);
    }
    const decoded: string[] = [];
    for (const segment of resolved) {
        const value = decodeSegment(segment);
        if (value === null) return INVALID;
        decoded.push(value);
    }
    if (decoded.length === 0) return INVALID;
    const path = toWorkspacePath(decoded.join("/"));
    return path.ok ? { kind: "workspace", path: path.value } : INVALID;
}

const ENCODED_CHARACTERS = new Set(' "#%():<>?[\\]^`{|}');

export function encodeLinkSegment(segment: string): string {
    let result = "";
    for (const char of segment) {
        const code = char.codePointAt(0) ?? 0;
        result +=
            code < 0x20 || code === 0x7f || ENCODED_CHARACTERS.has(char)
                ? `%${code.toString(16).toUpperCase().padStart(2, "0")}`
                : char;
    }
    return result;
}

export function buildRelativeLink(
    notePath: WorkspacePath,
    targetPath: WorkspacePath,
): string {
    const noteDirectory = notePath.split("/").slice(0, -1);
    const target = targetPath.split("/");
    let common = 0;
    while (
        common < noteDirectory.length &&
        common < target.length - 1 &&
        noteDirectory[common] === target[common]
    ) {
        common += 1;
    }
    const segments = [
        ...Array<string>(noteDirectory.length - common).fill(".."),
        ...target.slice(common),
    ];
    return segments
        .map((segment) =>
            segment === ".." ? segment : encodeLinkSegment(segment),
        )
        .join("/");
}

export function formatImageLink(alt: string, destination: string): string {
    const escaped = alt.replace(/[\\[\]]/g, (char) => `\\${char}`);
    return `![${escaped}](${destination})`;
}
