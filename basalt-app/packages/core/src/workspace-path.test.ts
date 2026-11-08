import { describe, expect, it } from "vitest";
import {
    pathKey,
    toWorkspacePath,
    validateNoteName,
    type WorkspacePath,
} from "./index";

function path(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(`expected valid path: ${input}`);
    return result.value;
}

describe("toWorkspacePath", () => {
    it.each([
        "note.md",
        "folder/note.md",
        "a/b/c.md",
        "Zażółć gęślą.md",
        "a b/.hidden",
    ])("accepts %j unchanged", (input) => {
        expect(toWorkspacePath(input)).toEqual({ ok: true, value: input });
    });

    it.each([
        "",
        "../x",
        "a/../../b",
        "a/..",
        "./a",
        "a/./b",
        "/etc/passwd",
        "a//b",
        "a/",
        "C:/Users/x.md",
        "c:x.md",
        "C:\\Users\\x.md",
        "a\\b.md",
        "a\u0000b.md",
        "a\nb.md",
        "a\u007fb.md",
    ])("rejects %j with invalid-path", (input) => {
        const result = toWorkspacePath(input);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("invalid-path");
    });

    it("keeps NFD names exactly as given", () => {
        const nfd = "Cafe\u0301.md";
        const result = toWorkspacePath(nfd);
        expect(result.ok && result.value).toBe(nfd);
        expect(result.ok && result.value).not.toBe(nfd.normalize("NFC"));
    });
});

describe("pathKey", () => {
    it("collides NFD and NFC spellings while the paths stay distinct", () => {
        const nfd = path("Cafe\u0301.md");
        const nfc = path("Caf\u00e9.md");
        expect(nfd).not.toBe(nfc);
        expect(pathKey(nfd)).toBe(pathKey(nfc));
    });

    it("collides case-only differences", () => {
        expect(pathKey(path("Notes/A.md"))).toBe(pathKey(path("notes/a.MD")));
    });

    it("does not collide different names", () => {
        expect(pathKey(path("a.md"))).not.toBe(pathKey(path("b.md")));
        expect(pathKey(path("a/b.md"))).not.toBe(pathKey(path("a-b.md")));
    });
});

describe("validateNoteName", () => {
    it.each([
        "Note",
        "Note.md",
        "My note 1",
        "Zażółć",
        "a.b.c",
        ".hidden",
        "CONSOLE",
        "com10",
    ])("accepts %j", (name) => {
        expect(validateNoteName(name)).toEqual({ valid: true });
    });

    it.each([
        ["", "empty"],
        ["..", "traversal"],
        [".", "traversal"],
        ["a/b", "separator"],
        ["a\\b", "separator"],
        ["a:b", "invalid-character"],
        ["a*b", "invalid-character"],
        ["a?b", "invalid-character"],
        ['a"b', "invalid-character"],
        ["a<b", "invalid-character"],
        ["a>b", "invalid-character"],
        ["a|b", "invalid-character"],
        ["a\u0000b", "invalid-character"],
        ["a\tb", "invalid-character"],
        ["CON", "reserved-name"],
        ["con", "reserved-name"],
        ["Nul.md", "reserved-name"],
        ["aux.tar.gz", "reserved-name"],
        ["PRN", "reserved-name"],
        ["COM1", "reserved-name"],
        ["lpt9.txt", "reserved-name"],
        ["note.", "trailing-dot-or-space"],
        ["note ", "trailing-dot-or-space"],
        ["note.md.", "trailing-dot-or-space"],
    ] as const)("rejects %j as %s", (name, reason) => {
        expect(validateNoteName(name)).toEqual({ valid: false, reason });
    });

    it("limits length in UTF-8 bytes, not characters", () => {
        expect(validateNoteName("a".repeat(255))).toEqual({ valid: true });
        expect(validateNoteName("a".repeat(256))).toEqual({
            valid: false,
            reason: "too-long",
        });
        expect(validateNoteName("ż".repeat(127))).toEqual({ valid: true });
        expect(validateNoteName("ż".repeat(128))).toEqual({
            valid: false,
            reason: "too-long",
        });
    });
});
