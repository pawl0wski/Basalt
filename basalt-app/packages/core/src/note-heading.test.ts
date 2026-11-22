import { describe, expect, it } from "vitest";
import { firstHeading, setFirstHeading } from "./note-heading";

describe("firstHeading", () => {
    it("returns the plain text and ranges of the first top-level H1", () => {
        expect(firstHeading("# Test\n\nbody")).toEqual({
            text: "Test",
            line: { from: 0, to: 6 },
            content: { from: 2, to: 6 },
        });
    });

    it("finds an H1 after other blocks and keeps the first of several", () => {
        expect(firstHeading("intro\n\n# First\n# Second")?.text).toBe("First");
    });

    it("reports an empty heading with an empty content range at the line end", () => {
        expect(firstHeading("# ")).toEqual({
            text: "",
            line: { from: 0, to: 2 },
            content: { from: 2, to: 2 },
        });
        expect(firstHeading("#")?.text).toBe("");
    });

    it.each([
        ["no heading", "just text"],
        ["empty note", ""],
        ["an H2", "## Two"],
        ["a setext H1", "Title\n====="],
        ["a missing space", "#Title"],
        ["a blockquote", "> # Quoted"],
        ["a list item", "- # Item"],
        ["a code block", "```\n# code\n```"],
        ["an indented code block", "    # code"],
    ])("ignores %s", (_, text) => {
        expect(firstHeading(text)).toBeNull();
    });

    it("strips emphasis, code, link and image syntax to plain text", () => {
        expect(firstHeading("# **Bold** and *em* `code`")?.text).toBe(
            "Bold and em code",
        );
        expect(firstHeading("# [label](target.md) here")?.text).toBe(
            "label here",
        );
    });

    it("treats an image-only heading as empty", () => {
        expect(firstHeading("# ![](img.png)")?.text).toBe("");
    });

    it("drops the closing hashes and unescapes backslash escapes", () => {
        expect(firstHeading("# Title #")?.text).toBe("Title");
        expect(firstHeading("# a\\*b")?.text).toBe("a*b");
    });

    it("keeps the line range before a CRLF", () => {
        const heading = firstHeading("# Test\r\nbody");
        expect(heading?.line).toEqual({ from: 0, to: 6 });
        expect(heading?.text).toBe("Test");
    });
});

describe("setFirstHeading", () => {
    it("replaces the content of an existing heading and keeps the rest byte for byte", () => {
        expect(setFirstHeading("# Old\n\nbody  \n", "New")).toBe(
            "# New\n\nbody  \n",
        );
    });

    it("replaces a formatted heading with plain text", () => {
        expect(setFirstHeading("# **Old** #\nx", "New")).toBe("# New\nx");
    });

    it("fills an empty heading", () => {
        expect(setFirstHeading("# ", "Name")).toBe("# Name");
        expect(setFirstHeading("#\nx", "Name")).toBe("# Name\nx");
    });

    it("inserts a heading at the top when there is none", () => {
        expect(setFirstHeading("body", "Name")).toBe("# Name\n\nbody");
    });

    it("inserts only the heading into an empty note", () => {
        expect(setFirstHeading("", "Name")).toBe("# Name");
    });

    it("uses CRLF for an inserted heading in a CRLF note and keeps CRLF otherwise", () => {
        expect(setFirstHeading("a\r\nb", "N")).toBe("# N\r\n\r\na\r\nb");
        expect(setFirstHeading("# Old\r\nb", "N")).toBe("# N\r\nb");
    });

    it("does not treat an H2 as the title", () => {
        expect(setFirstHeading("## Two", "Name")).toBe("# Name\n\n## Two");
    });
});

describe("firstHeading with many candidate lines", () => {
    it("skips hash lines inside code blocks and finds the later real heading", () => {
        expect(firstHeading("```\n# in code\n```\n\n# Real")?.text).toBe(
            "Real",
        );
    });

    it("finds a heading after more than fifty rejected candidates", () => {
        const fenced = `\`\`\`\n${Array.from({ length: 60 }, (_, i) => `# c${String(i)}`).join("\n")}\n\`\`\`\n\n# Real`;
        expect(firstHeading(fenced)?.text).toBe("Real");
    });

    it("accepts up to three leading spaces and rejects four", () => {
        expect(firstHeading("   # Spaced")?.text).toBe("Spaced");
        expect(firstHeading("    # Code")).toBeNull();
    });

    it("keeps positions in the full text", () => {
        const text = "para\n\n# Title\nrest";
        const heading = firstHeading(text);
        expect(text.slice(heading?.content.from, heading?.content.to)).toBe(
            "Title",
        );
    });
});
