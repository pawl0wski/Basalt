import { buildTree, toWorkspacePath, type FileEntry } from "@basalt/core";
import { describe, expect, it } from "vitest";
import {
    ancestorFolders,
    childrenOf,
    findTreeNode,
    toTreeNodes,
} from "./tree-nodes";

function path(value: string) {
    const parsed = toWorkspacePath(value);
    if (!parsed.ok) throw new Error(value);
    return parsed.value;
}

function entries(): FileEntry[] {
    return [
        { path: path("projects"), kind: "directory" },
        { path: path("projects/2026"), kind: "directory" },
        { path: path("projects/2026/Plan.md"), kind: "file" },
        { path: path("projects/Roadmap.md"), kind: "file" },
        { path: path("empty"), kind: "directory" },
        { path: path("Ideas.md"), kind: "file" },
    ];
}

describe("toTreeNodes", () => {
    it("maps folders and notes to ui nodes with the path as id and no .md", () => {
        const nodes = toTreeNodes(buildTree(entries()), new Set(["projects"]));

        expect(nodes).toEqual([
            {
                kind: "folder",
                id: "empty",
                name: "empty",
                expanded: false,
                children: [],
            },
            {
                kind: "folder",
                id: "projects",
                name: "projects",
                expanded: true,
                children: [
                    {
                        kind: "folder",
                        id: "projects/2026",
                        name: "2026",
                        expanded: false,
                        children: [
                            {
                                kind: "note",
                                id: "projects/2026/Plan.md",
                                name: "Plan",
                            },
                        ],
                    },
                    {
                        kind: "note",
                        id: "projects/Roadmap.md",
                        name: "Roadmap",
                    },
                ],
            },
            { kind: "note", id: "Ideas.md", name: "Ideas" },
        ]);
    });

    it("keeps empty folders and expands only the listed ones", () => {
        const nodes = toTreeNodes(
            buildTree(entries()),
            new Set(["empty", "projects/2026"]),
        );

        expect(nodes[0]).toMatchObject({
            id: "empty",
            expanded: true,
            children: [],
        });
        expect(nodes[1]).toMatchObject({ id: "projects", expanded: false });
    });
});

describe("ancestorFolders", () => {
    it("lists every folder above a note from the outermost", () => {
        expect(ancestorFolders("a/b/c/note.md")).toEqual(["a", "a/b", "a/b/c"]);
    });

    it("is empty for a note in the root", () => {
        expect(ancestorFolders("note.md")).toEqual([]);
    });
});

describe("findTreeNode and childrenOf", () => {
    const tree = buildTree(entries());

    it("finds a nested note and a folder", () => {
        expect(findTreeNode(tree, "projects/2026/Plan.md")).toMatchObject({
            kind: "note",
            name: "Plan",
        });
        expect(findTreeNode(tree, "projects/2026")).toMatchObject({
            kind: "folder",
        });
    });

    it("returns null for a missing path and does not match a name prefix", () => {
        expect(findTreeNode(tree, "projects/Missing.md")).toBeNull();
        expect(findTreeNode(tree, "proj")).toBeNull();
    });

    it("returns the root nodes for null and the children of a folder", () => {
        expect(childrenOf(tree, null)).toBe(tree);
        expect(
            childrenOf(tree, path("projects")).map((node) => node.name),
        ).toEqual(["2026", "Roadmap"]);
        expect(childrenOf(tree, path("gone"))).toEqual([]);
        expect(childrenOf(tree, path("Ideas.md"))).toEqual([]);
    });
});
