import { folderOf, joinPath } from "./names";
import type { Entry, Files } from "./types";

export type Line =
    | { kind: "blank" }
    | { kind: "heading"; level: 1 | 2 | 3; text: string }
    | { kind: "task"; checked: boolean; text: string }
    | { kind: "bullet"; text: string }
    | { kind: "quote"; text: string }
    | { kind: "fence" }
    | { kind: "code"; text: string }
    | { kind: "image"; alt: string; destination: string }
    | { kind: "paragraph"; text: string };

const IMAGE_LINE = /^!\[([^\]]*)\]\((.*)\)\s*$/;

export function classifyLines(lines: string[]): Line[] {
    let inFence = false;
    return lines.map((line): Line => {
        if (/^```/.test(line)) {
            inFence = !inFence;
            return { kind: "fence" };
        }
        if (inFence) return { kind: "code", text: line };
        if (line.trim() === "") return { kind: "blank" };
        const heading = /^(#{1,3}) (.*)$/.exec(line);
        if (heading)
            return {
                kind: "heading",
                level: heading[1].length as 1 | 2 | 3,
                text: heading[2],
            };
        const task = /^- \[( |x)\] (.*)$/i.exec(line);
        if (task)
            return {
                kind: "task",
                checked: task[1].toLowerCase() === "x",
                text: task[2],
            };
        const bullet = /^- (.*)$/.exec(line);
        if (bullet) return { kind: "bullet", text: bullet[1] };
        const quote = /^> ?(.*)$/.exec(line);
        if (quote) return { kind: "quote", text: quote[1] };
        const image = IMAGE_LINE.exec(line);
        if (image)
            return { kind: "image", alt: image[1], destination: image[2] };
        return { kind: "paragraph", text: line };
    });
}

export type Inline =
    | { kind: "text"; text: string }
    | { kind: "strong"; text: string }
    | { kind: "em"; text: string }
    | { kind: "code"; text: string }
    | { kind: "link"; text: string; href: string };

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]*)\)/g;

export function inlineTokens(text: string): Inline[] {
    const tokens: Inline[] = [];
    let last = 0;
    for (const match of text.matchAll(INLINE)) {
        const start = match.index ?? 0;
        if (start > last)
            tokens.push({ kind: "text", text: text.slice(last, start) });
        if (match[1] !== undefined)
            tokens.push({ kind: "strong", text: match[1] });
        else if (match[2] !== undefined)
            tokens.push({ kind: "em", text: match[2] });
        else if (match[3] !== undefined)
            tokens.push({ kind: "code", text: match[3] });
        else tokens.push({ kind: "link", text: match[4], href: match[5] });
        last = start + match[0].length;
    }
    if (last < text.length)
        tokens.push({ kind: "text", text: text.slice(last) });
    return tokens;
}

export type Destination =
    { kind: "path"; path: string } | { kind: "remote" } | { kind: "invalid" };

export function resolveDestination(notePath: string, raw: string): Destination {
    let destination = raw.trim();
    const quoted = /^(.*?)\s+"[^"]*"$/.exec(destination);
    if (quoted) destination = quoted[1];
    if (destination.startsWith("<") && destination.endsWith(">"))
        destination = destination.slice(1, -1);
    destination = destination.replace(/[#?].*$/, "");
    const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(destination);
    if (scheme) {
        return /^https?$/i.test(scheme[1])
            ? { kind: "remote" }
            : { kind: "invalid" };
    }
    if (
        destination === "" ||
        destination.startsWith("/") ||
        destination.includes("\\")
    )
        return { kind: "invalid" };
    const segments = folderOf(notePath) ? folderOf(notePath).split("/") : [];
    for (const segment of destination.split("/")) {
        if (segment === "." || segment === "") continue;
        if (segment === "..") {
            if (segments.length === 0) return { kind: "invalid" };
            segments.pop();
            continue;
        }
        let decoded: string;
        try {
            decoded = decodeURIComponent(segment);
        } catch {
            return { kind: "invalid" };
        }
        if (
            decoded === "." ||
            decoded === ".." ||
            /[/\\\u0000-\u001f]/.test(decoded)
        )
            return { kind: "invalid" };
        segments.push(decoded);
    }
    return { kind: "path", path: segments.join("/") };
}

export function encodeSegment(segment: string) {
    return segment.replace(
        /[\u0000-\u001f "#%():<>?[\\\]^`{|}]/g,
        (character) =>
            `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
    );
}

export function relativeLink(notePath: string, targetPath: string) {
    const from = folderOf(notePath) ? folderOf(notePath).split("/") : [];
    const to = targetPath.split("/");
    let shared = 0;
    while (
        shared < from.length &&
        shared < to.length - 1 &&
        from[shared] === to[shared]
    )
        shared += 1;
    const up = from.slice(shared).map(() => "..");
    return [...up, ...to.slice(shared)].map(encodeSegment).join("/");
}

export type ImageView =
    | { kind: "image"; entry: Extract<Entry, { kind: "image" }> }
    | {
          kind: "problem";
          problem:
              | "not-found"
              | "unreadable"
              | "unsupported"
              | "too-large"
              | "remote"
              | "invalid"
              | "broken";
          path?: string;
      };

export function resolveImage(
    files: Files,
    notePath: string,
    destination: string,
): ImageView {
    const resolved = resolveDestination(notePath, destination);
    if (resolved.kind === "remote")
        return { kind: "problem", problem: "remote" };
    if (resolved.kind === "invalid")
        return { kind: "problem", problem: "invalid" };
    const entry = files[resolved.path];
    if (!entry)
        return { kind: "problem", problem: "not-found", path: resolved.path };
    if (entry.kind !== "image")
        return { kind: "problem", problem: "unsupported" };
    switch (entry.state) {
        case "ok":
            return { kind: "image", entry };
        case "corrupt":
            return { kind: "problem", problem: "broken" };
        default:
            return { kind: "problem", problem: entry.state };
    }
}

export function rewriteImageLinks(
    text: string,
    fromNote: string,
    toNote: string,
) {
    const lines = text.split("\n");
    const classified = classifyLines(lines);
    return lines
        .map((line, index) => {
            const parsed = classified[index];
            if (parsed.kind !== "image") return line;
            const target = resolveDestination(fromNote, parsed.destination);
            if (target.kind !== "path") return line;
            return `![${parsed.alt}](${relativeLink(toNote, target.path)})`;
        })
        .join("\n");
}

export function countWords(text: string) {
    const trimmed = text.trim();
    return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

export function pastedImageName(clock: number, taken: string[]) {
    const date = new Date(clock);
    const pad = (value: number) => String(value).padStart(2, "0");
    const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    const base = `Pasted image ${stamp}`;
    const used = new Set(taken.map((name) => name.toLowerCase()));
    let candidate = base;
    for (let index = 1; used.has(`${candidate}.png`.toLowerCase()); index += 1)
        candidate = `${base} ${index}`;
    return candidate;
}

export function attachmentPath(name: string) {
    return joinPath("attachments", `${name}.png`);
}
