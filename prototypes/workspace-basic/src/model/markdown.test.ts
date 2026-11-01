import { describe, expect, it } from "vitest";
import {
    classifyLines,
    pastedImageName,
    relativeLink,
    resolveDestination,
    resolveImage,
} from "./markdown";
import { createWorkspace } from "./workspaces";

describe("resolveDestination", () => {
    it("resolves relative to the note and decodes percent escapes", () => {
        expect(
            resolveDestination("demo/Note.md", "../attachments/A%20b.png"),
        ).toEqual({ kind: "path", path: "attachments/A b.png" });
    });

    it("marks remote, escaping, absolute and malformed links", () => {
        expect(resolveDestination("n.md", "https://x.test/a.png")).toEqual({
            kind: "remote",
        });
        expect(resolveDestination("n.md", "../x.png")).toEqual({
            kind: "invalid",
        });
        expect(resolveDestination("n.md", "/x.png")).toEqual({
            kind: "invalid",
        });
        expect(resolveDestination("n.md", "a%2Fb.png")).toEqual({
            kind: "invalid",
        });
        expect(resolveDestination("n.md", "")).toEqual({ kind: "invalid" });
    });
});

describe("resolveImage", () => {
    const files = createWorkspace("W1").files;

    it("does not search the workspace for an Obsidian-style link", () => {
        expect(
            resolveImage(
                files,
                "demo/Images, all cases.md",
                "Roadmap diagram.png",
            ),
        ).toMatchObject({ problem: "not-found" });
    });

    it("maps image states to placeholders", () => {
        const view = (name: string) =>
            resolveImage(files, "Note.md", `attachments/${name}`);
        expect(view("Roadmap%20diagram.png").kind).toBe("image");
        expect(view("Photo%20001.JPG")).toMatchObject({
            problem: "unreadable",
        });
        expect(view("Scan.heic")).toMatchObject({ problem: "unsupported" });
        expect(view("Huge.png")).toMatchObject({ problem: "too-large" });
        expect(view("Broken.png")).toMatchObject({ problem: "broken" });
    });
});

describe("relativeLink", () => {
    it("builds links from the note's folder", () => {
        expect(relativeLink("Note.md", "attachments/A b.png")).toBe(
            "attachments/A%20b.png",
        );
        expect(relativeLink("projects/Note.md", "attachments/a.png")).toBe(
            "../attachments/a.png",
        );
        expect(relativeLink("projects/archive/N.md", "attachments/a.png")).toBe(
            "../../attachments/a.png",
        );
    });
});

describe("pastedImageName", () => {
    it("uses the demo clock and suffixes a second paste in the same second", () => {
        const clock = new Date(2026, 9, 25, 14, 30, 12).getTime();
        expect(pastedImageName(clock, [])).toBe("Pasted image 20261025143012");
        expect(
            pastedImageName(clock, ["Pasted image 20261025143012.png"]),
        ).toBe("Pasted image 20261025143012 1");
    });
});

describe("classifyLines", () => {
    it("does not treat an image link inside a code block as an image", () => {
        const lines = classifyLines([
            "```",
            "![a](b.png)",
            "```",
            "![a](b.png)",
        ]);
        expect(lines.map((line) => line.kind)).toEqual([
            "fence",
            "code",
            "fence",
            "image",
        ]);
    });
});

describe("demo note with every image case", () => {
    it("shows no widget for HTML and reference-style images", () => {
        const files = createWorkspace("W1").files;
        const entry = files["demo/Images, all cases.md"];
        const text = entry.kind === "note" ? entry.text : "";
        const kinds = classifyLines(text.split("\n"));
        const html = kinds.find(
            (line) => line.kind === "paragraph" && line.text.startsWith("<img"),
        );
        const reference = kinds.find(
            (line) =>
                line.kind === "paragraph" &&
                line.text.includes("![Reference][ref]"),
        );
        expect(html).toBeDefined();
        expect(reference).toBeDefined();
        expect(kinds.filter((line) => line.kind === "image")).toHaveLength(9);
    });
});
