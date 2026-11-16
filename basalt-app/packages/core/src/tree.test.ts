import { describe, expect, it } from "vitest";
import type { FileEntry, FileKind } from "./ports";
import { buildTree, type TreeNode } from "./tree";
import { toWorkspacePath } from "./workspace-path";

function entry(path: string, kind: FileKind = "file"): FileEntry {
    const result = toWorkspacePath(path);
    if (!result.ok) throw new Error(`invalid ${path}`);
    return { path: result.value, kind };
}

function outline(nodes: readonly TreeNode[]): string[] {
    return nodes.flatMap((node) =>
        node.kind === "folder"
            ? [
                  `${node.path}/`,
                  ...outline(node.children).map((line) => `  ${line}`),
              ]
            : [node.path],
    );
}

describe("buildTree", () => {
    it("is empty for an empty workspace", () => {
        expect(buildTree([])).toEqual([]);
    });

    it("nests notes under their folders and names notes without the extension", () => {
        const tree = buildTree([
            entry("docs", "directory"),
            entry("docs/guide", "directory"),
            entry("docs/guide/setup.md"),
            entry("docs/intro.md"),
            entry("top.md"),
        ]);

        expect(outline(tree)).toEqual([
            "docs/",
            "  docs/guide/",
            "    docs/guide/setup.md",
            "  docs/intro.md",
            "top.md",
        ]);
        const docs = tree[0];
        expect(docs).toMatchObject({ kind: "folder", name: "docs" });
        const guide = docs?.kind === "folder" ? docs.children[0] : undefined;
        expect(guide).toMatchObject({
            kind: "folder",
            name: "guide",
            path: "docs/guide",
        });
        expect(tree[1]).toEqual({ kind: "note", name: "top", path: "top.md" });
    });

    it("keeps empty folders", () => {
        const tree = buildTree([entry("empty", "directory")]);

        expect(tree).toEqual([
            { kind: "folder", name: "empty", path: "empty", children: [] },
        ]);
    });

    it("creates the folders of a note whose directory entries are missing", () => {
        expect(outline(buildTree([entry("a/b/c.md")]))).toEqual([
            "a/",
            "  a/b/",
            "    a/b/c.md",
        ]);
    });

    it("does not duplicate a folder listed both as an entry and as an ancestor", () => {
        const tree = buildTree([
            entry("a/n.md"),
            entry("a", "directory"),
            entry("a/m.md"),
        ]);

        expect(tree).toHaveLength(1);
        expect(outline(tree)).toEqual(["a/", "  a/m.md", "  a/n.md"]);
    });

    it("shows only Markdown notes and matches the extension case-insensitively", () => {
        const tree = buildTree([
            entry("a.md"),
            entry("B.MD"),
            entry("c.txt"),
            entry("d.png"),
            entry("noext"),
            entry("link.md", "symlink"),
        ]);

        expect(outline(tree)).toEqual(["a.md", "B.MD"]);
        expect(tree[1]).toMatchObject({ name: "B" });
    });

    it("hides the root attachments folder with everything in it but not a nested one", () => {
        const tree = buildTree([
            entry("attachments", "directory"),
            entry("attachments/note.md"),
            entry("attachments/sub", "directory"),
            entry("docs/attachments", "directory"),
            entry("docs/attachments/x.md"),
        ]);

        expect(outline(tree)).toEqual([
            "docs/",
            "  docs/attachments/",
            "    docs/attachments/x.md",
        ]);
    });

    it("keeps a note or folder that only starts with the word attachments", () => {
        expect(
            outline(
                buildTree([
                    entry("attachments-old", "directory"),
                    entry("attachments.md"),
                ]),
            ),
        ).toEqual(["attachments-old/", "attachments.md"]);
    });

    it("hides dot entries and everything under dot folders", () => {
        const tree = buildTree([
            entry(".git", "directory"),
            entry(".git/notes.md"),
            entry(".hidden.md"),
            entry("docs/.draft.md"),
            entry("docs/.obsidian", "directory"),
            entry("docs/visible.md"),
        ]);

        expect(outline(tree)).toEqual(["docs/", "  docs/visible.md"]);
    });

    it("lists folders before notes at every level", () => {
        const tree = buildTree([
            entry("a.md"),
            entry("z", "directory"),
            entry("z/a.md"),
            entry("z/y", "directory"),
            entry("b", "directory"),
        ]);

        expect(outline(tree)).toEqual([
            "b/",
            "z/",
            "  z/y/",
            "  z/a.md",
            "a.md",
        ]);
    });

    it("sorts case-insensitively and naturally", () => {
        const tree = buildTree([
            entry("note10.md"),
            entry("Note2.md"),
            entry("note1.md"),
            entry("banana.md"),
            entry("Apple.md"),
            entry("Zebra.md"),
        ]);

        expect(tree.map((node) => node.name)).toEqual([
            "Apple",
            "banana",
            "note1",
            "Note2",
            "note10",
            "Zebra",
        ]);
    });

    it("sorts names that differ only by case deterministically regardless of input order", () => {
        const forward = buildTree([entry("a.md"), entry("A.md")]);
        const backward = buildTree([entry("A.md"), entry("a.md")]);

        expect(forward).toEqual(backward);
        expect(forward).toHaveLength(2);
    });

    it("keeps non-ASCII names and compares accented letters by their base letter first", () => {
        const tree = buildTree([
            entry("Zażółć.md"),
            entry("żaba.md"),
            entry("Ola.md"),
        ]);

        expect(tree.map((node) => node.name)).toEqual([
            "Ola",
            "żaba",
            "Zażółć",
        ]);
    });

    it("does not treat a folder named like a note as a note", () => {
        const tree = buildTree([
            entry("x.md", "directory"),
            entry("x.md/y.md"),
        ]);

        expect(outline(tree)).toEqual(["x.md/", "  x.md/y.md"]);
    });

    it("ignores symlinked folders", () => {
        expect(buildTree([entry("link", "symlink")])).toEqual([]);
    });
});
