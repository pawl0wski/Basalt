import { GFM, parser } from "@lezer/markdown";
import { buildRelativeLink, resolveLinkTarget } from "./links";
import type { WorkspacePath } from "./workspace-path";

const markdown = parser.configure(GFM);
const LINK_NODES = new Set(["Link", "Image", "LinkReference"]);
const SUFFIX_START = /[#?]/;

interface Replacement {
    readonly from: number;
    readonly to: number;
    readonly text: string;
}

function directoryOf(path: WorkspacePath): string {
    return path.slice(0, path.lastIndexOf("/") + 1);
}

function rewriteDestination(
    raw: string,
    oldNote: WorkspacePath,
    newNote: WorkspacePath,
): string | null {
    const target = resolveLinkTarget(oldNote, raw);
    if (target.kind !== "workspace") return null;
    const bracketed = raw.startsWith("<") && raw.endsWith(">");
    const inner = bracketed ? raw.slice(1, -1) : raw.trim();
    const cut = inner.search(SUFFIX_START);
    const suffix = cut >= 0 ? inner.slice(cut) : "";
    const oldPath = cut >= 0 ? inner.slice(0, cut) : inner;
    const newPath = buildRelativeLink(newNote, target.path);
    if (newPath === oldPath) return null;
    const rewritten = `${newPath}${suffix}`;
    return bracketed ? `<${rewritten}>` : rewritten;
}

export function rewriteRelativeLinks(
    text: string,
    oldNote: WorkspacePath,
    newNote: WorkspacePath,
): string {
    if (directoryOf(oldNote) === directoryOf(newNote)) return text;
    const replacements: Replacement[] = [];
    markdown.parse(text).iterate({
        enter(node) {
            if (!LINK_NODES.has(node.name)) return;
            const url = node.node.getChild("URL");
            if (!url) return;
            const rewritten = rewriteDestination(
                text.slice(url.from, url.to),
                oldNote,
                newNote,
            );
            if (rewritten !== null) {
                replacements.push({
                    from: url.from,
                    to: url.to,
                    text: rewritten,
                });
            }
        },
    });
    let result = text;
    for (const replacement of replacements.reverse()) {
        result =
            result.slice(0, replacement.from) +
            replacement.text +
            result.slice(replacement.to);
    }
    return result;
}
