import { parser } from "@lezer/markdown";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
    buildRelativeLink,
    encodeLinkSegment,
    formatImageLink,
    resolveLinkTarget,
} from "./links";
import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

function p(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(input);
    return result.value;
}

const workspace = (path: string) => ({ kind: "workspace", path: p(path) });
const invalid = { kind: "invalid" };

describe("resolveLinkTarget", () => {
    it("takes the folders of the note literally and decodes only the destination", () => {
        expect(resolveLinkTarget(p("100%/n.md"), "t.md")).toEqual(
            workspace("100%/t.md"),
        );
        expect(resolveLinkTarget(p("a%20b/n.md"), "x%20y.md")).toEqual(
            workspace("a%20b/x y.md"),
        );
        expect(resolveLinkTarget(p("a%20b/c/n.md"), "../t.md")).toEqual(
            workspace("a%20b/t.md"),
        );
    });

    it("resolves relative to the note in the root and in folders", () => {
        expect(resolveLinkTarget(p("a.md"), "attachments/x.png")).toEqual(
            workspace("attachments/x.png"),
        );
        expect(
            resolveLinkTarget(p("Projects/Plan.md"), "../attachments/x.png"),
        ).toEqual(workspace("attachments/x.png"));
        expect(resolveLinkTarget(p("a/b/c.md"), "./img/x.png")).toEqual(
            workspace("a/b/img/x.png"),
        );
        expect(resolveLinkTarget(p("a/b/c.md"), "../../x.png")).toEqual(
            workspace("x.png"),
        );
    });

    it("rejects a path that escapes the workspace root", () => {
        expect(resolveLinkTarget(p("a.md"), "../x.png")).toEqual(invalid);
        expect(resolveLinkTarget(p("a/b.md"), "../../x.png")).toEqual(invalid);
    });

    it("strips angle brackets, fragment and query", () => {
        expect(resolveLinkTarget(p("a.md"), "<my img.png>")).toEqual(
            workspace("my img.png"),
        );
        expect(resolveLinkTarget(p("a.md"), "x.png#frag")).toEqual(
            workspace("x.png"),
        );
        expect(resolveLinkTarget(p("a.md"), "x.png?w=2")).toEqual(
            workspace("x.png"),
        );
    });

    it("percent-decodes segments and keeps NFD names", () => {
        expect(resolveLinkTarget(p("a.md"), "my%20img.png")).toEqual(
            workspace("my img.png"),
        );
        const nfd = "e\u0301.png";
        expect(resolveLinkTarget(p("a.md"), nfd)).toEqual(workspace(nfd));
        expect(resolveLinkTarget(p("a.md"), "100%25.png")).toEqual(
            workspace("100%.png"),
        );
    });

    it("rejects invalid escapes, encoded separators, dot segments and control characters", () => {
        for (const bad of [
            "a%zz.png",
            "a%2Fb.png",
            "a%5Cb.png",
            "x%00.png",
            "%2E%2E/x.png",
            "%2e.png/../%2E",
            "a%E0%A4%A.png",
        ]) {
            expect(resolveLinkTarget(p("a.md"), bad)).toEqual(invalid);
        }
    });

    it("rejects empty, absolute, backslash and empty-segment destinations", () => {
        for (const bad of [
            "",
            "   ",
            "/x.png",
            "\\x.png",
            "a\\b.png",
            "a//b.png",
            "dir/",
            "#only",
            "<>",
        ]) {
            expect(resolveLinkTarget(p("a.md"), bad)).toEqual(invalid);
        }
    });

    it("classifies schemes", () => {
        expect(resolveLinkTarget(p("a.md"), "https://x.test/a.png")).toEqual({
            kind: "remote",
        });
        expect(resolveLinkTarget(p("a.md"), "HTTP://x.test/a.png")).toEqual({
            kind: "remote",
        });
        for (const url of [
            "data:image/png;base64,AA",
            "file:///x.png",
            "obsidian://open",
            "C:\\x.png",
            "C:/x.png",
        ]) {
            expect(resolveLinkTarget(p("a.md"), url)).toEqual({
                kind: "unsupported-scheme",
            });
        }
    });

    it("does not search elsewhere for a missing folder", () => {
        expect(resolveLinkTarget(p("Projects/Plan.md"), "x.png")).toEqual(
            workspace("Projects/x.png"),
        );
    });
});

describe("encodeLinkSegment", () => {
    it("encodes characters CommonMark or other editors misread and keeps non-ASCII", () => {
        expect(
            encodeLinkSegment('a b#c%d(e)f:g<h>i?j[k\\l]m^n`o{p|q}r"s'),
        ).toBe(
            "a%20b%23c%25d%28e%29f%3Ag%3Ch%3Ei%3Fj%5Bk%5Cl%5Dm%5En%60o%7Bp%7Cq%7Dr%22s",
        );
        expect(encodeLinkSegment("zażółć.png")).toBe("zażółć.png");
        expect(encodeLinkSegment("a\tb\u007f")).toBe("a%09b%7F");
    });

    it("encodes a colon so a first segment is never read as a scheme", () => {
        expect(
            resolveLinkTarget(p("d/a.md"), encodeLinkSegment("a:b.png")),
        ).toEqual(workspace("d/a:b.png"));
    });
});

describe("buildRelativeLink", () => {
    it.each([
        ["a.md", "attachments/x.png", "attachments/x.png"],
        ["Projects/Plan.md", "attachments/x.png", "../attachments/x.png"],
        ["a/b/c.md", "a/img/x.png", "../img/x.png"],
        ["a/b.md", "a/x.png", "x.png"],
        ["a/b.md", "a/b/x.png", "b/x.png"],
        [
            "Pasted image 1.md",
            "attachments/Pasted image 2.png",
            "attachments/Pasted%20image%202.png",
        ],
    ])("from %s to %s", (note, target, expected) => {
        expect(buildRelativeLink(p(note), p(target))).toBe(expected);
    });

    it("round-trips through resolveLinkTarget for generated paths", () => {
        const segment = fc
            .stringMatching(/^[A-Za-z0-9 :#%()._é-]{1,8}$/)
            .filter(
                (value) =>
                    value !== "." &&
                    value !== ".." &&
                    !value.endsWith(".") &&
                    !value.endsWith(" "),
            );
        const path = fc
            .array(segment, { minLength: 1, maxLength: 4 })
            .map((parts) => parts.join("/"))
            .filter(
                (value) =>
                    toWorkspacePath(value).ok &&
                    toWorkspacePath(`${value}.md`).ok,
            );
        fc.assert(
            fc.property(path, path, (note, target) => {
                const notePath = p(`${note}.md`);
                const targetPath = p(target);
                const link = buildRelativeLink(notePath, targetPath);
                expect(resolveLinkTarget(notePath, link)).toEqual({
                    kind: "workspace",
                    path: targetPath,
                });
            }),
            { numRuns: 500 },
        );
    });

    it("produces a link that a CommonMark parser reads back as the same destination", () => {
        const names = [
            "a b.png",
            "x#1.png",
            "p(1).png",
            "c:d.png",
            "100%.png",
            "é.png",
        ];
        for (const name of names) {
            const link = formatImageLink(
                "alt",
                buildRelativeLink(p("n/note.md"), p(`attachments/${name}`)),
            );
            const tree = parser.parse(link);
            let url = "";
            tree.iterate({
                enter: (node) => {
                    if (node.name === "URL")
                        url = link.slice(node.from, node.to);
                },
            });
            expect(resolveLinkTarget(p("n/note.md"), url)).toEqual(
                workspace(`attachments/${name}`),
            );
        }
    });
});

describe("formatImageLink", () => {
    it("escapes backslashes and brackets in the alt text only", () => {
        expect(formatImageLink("a[b]\\c", "x.png")).toBe(
            "![a\\[b\\]\\\\c](x.png)",
        );
        expect(formatImageLink("plain", "dir/x.png")).toBe(
            "![plain](dir/x.png)",
        );
    });
});
