import {
    buildTree,
    toWorkspacePath,
    type FileEntry,
    type WorkspacePath,
} from "@basalt/core";
import { describe, expect, it } from "vitest";
import { validateEntryName } from "./entry-name";

function path(value: string) {
    const parsed = toWorkspacePath(value);
    if (!parsed.ok) throw new Error(value);
    return parsed.value;
}

const entries: FileEntry[] = [
    { path: path("Ideas.md"), kind: "file" },
    { path: path("Café.md"), kind: "file" },
    { path: path("docs"), kind: "directory" },
    { path: path("docs/Plan.md"), kind: "file" },
    { path: path("docs/2026"), kind: "directory" },
];
const tree = buildTree(entries);
const docs = path("docs");
const docsChildren = buildTree(entries).flatMap((node) =>
    node.kind === "folder" && node.path === docs ? node.children : [],
);

describe("validateEntryName", () => {
    it("accepts a fresh note name and a fresh folder name", () => {
        expect(
            validateEntryName({
                name: "Fresh",
                kind: "note",
                parent: null,
                siblings: tree,
            }),
        ).toBeNull();
        expect(
            validateEntryName({
                name: "Fresh",
                kind: "folder",
                parent: docs,
                siblings: docsChildren,
            }),
        ).toBeNull();
    });

    it("does not complain about an empty name (the submit button is disabled instead)", () => {
        expect(
            validateEntryName({
                name: "",
                kind: "note",
                parent: null,
                siblings: tree,
            }),
        ).toBeNull();
    });

    it.each([
        ["a/b", "separator"],
        ["a\\b", "separator"],
        ["..", "traversal"],
        ["a:b", "invalid-character"],
        ["CON", "reserved-name"],
        ["trailing.", "trailing-dot-or-space"],
        ["trailing ", "trailing-dot-or-space"],
        [".hidden", "leading-dot"],
        ["x".repeat(256), "too-long"],
        ["x".repeat(253), "too-long"],
    ])("reports %j as %s for a note", (name, problem) => {
        expect(
            validateEntryName({
                name,
                kind: "note",
                parent: null,
                siblings: tree,
            }),
        ).toBe(problem);
    });

    it("allows a name for a folder that would be too long only with .md", () => {
        expect(
            validateEntryName({
                name: "x".repeat(253),
                kind: "folder",
                parent: null,
                siblings: tree,
            }),
        ).toBeNull();
    });

    it.each([
        ["Ideas", "note"],
        ["ideas", "note"],
        ["IDEAS", "note"],
        ["Café", "note"],
        ["docs", "folder"],
        ["DOCS", "folder"],
    ] as const)(
        "rejects %j as a collision for a %s in the root",
        (name, kind) => {
            expect(
                validateEntryName({ name, kind, parent: null, siblings: tree }),
            ).toBe("collision");
        },
    );

    it("only compares with siblings of the same folder", () => {
        expect(
            validateEntryName({
                name: "Ideas",
                kind: "note",
                parent: docs,
                siblings: docsChildren,
            }),
        ).toBeNull();
        expect(
            validateEntryName({
                name: "plan",
                kind: "note",
                parent: docs,
                siblings: docsChildren,
            }),
        ).toBe("collision");
        expect(
            validateEntryName({
                name: "2026",
                kind: "folder",
                parent: docs,
                siblings: docsChildren,
            }),
        ).toBe("collision");
    });

    it("lets a note keep its own name with a different case or Unicode form", () => {
        expect(
            validateEntryName({
                name: "IDEAS",
                kind: "note",
                parent: null,
                siblings: tree,
                own: path("Ideas.md"),
            }),
        ).toBeNull();
        expect(
            validateEntryName({
                name: "Café",
                kind: "note",
                parent: null,
                siblings: tree,
                own: path("Café.md"),
            }),
        ).toBeNull();
    });

    it("still rejects another note's name when renaming", () => {
        expect(
            validateEntryName({
                name: "ideas",
                kind: "note",
                parent: null,
                siblings: tree,
                own: path("Café.md"),
            }),
        ).toBe("collision");
    });
});

describe("reserved folder names", () => {
    const base = { kind: "folder" as const, siblings: [] };

    it("reserves attachments at the workspace root, in any case", () => {
        expect(
            validateEntryName({ ...base, name: "attachments", parent: null }),
        ).toBe("reserved");
        expect(
            validateEntryName({ ...base, name: "Attachments", parent: null }),
        ).toBe("reserved");
    });

    it("allows attachments below the root and for notes", () => {
        expect(
            validateEntryName({
                ...base,
                name: "attachments",
                parent: "docs" as WorkspacePath,
            }),
        ).toBeNull();
        expect(
            validateEntryName({
                kind: "note",
                name: "attachments",
                parent: null,
                siblings: [],
            }),
        ).toBeNull();
    });
});
