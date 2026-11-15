import { describe, expect, it } from "vitest";
import { resolveLinkTarget } from "./links";
import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

function p(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(input);
    return result.value;
}

const workspace = (path: string) => ({ kind: "workspace", path: p(path) });
const invalid = { kind: "invalid" };

describe("resolveLinkTarget", () => {
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
