import { describe, expect, it } from "vitest";
import type { WorkspaceRoot } from "@basalt/core";
import { createNativePaths } from "./native-paths";

const root = (value: string) => value as WorkspaceRoot;

describe("createNativePaths on POSIX roots", () => {
    const paths = createNativePaths(root("/home/me/notes"));

    it("converts workspace paths to native absolute paths and back", () => {
        expect(paths.toNative("a/b.md")).toBe("/home/me/notes/a/b.md");
        expect(paths.toNative("")).toBe("/home/me/notes");
        expect(paths.toWorkspace("/home/me/notes/a/b.md")).toBe("a/b.md");
    });

    it("ignores a trailing separator on the root", () => {
        const trailing = createNativePaths(root("/home/me/notes/"));

        expect(trailing.toNative("a.md")).toBe("/home/me/notes/a.md");
        expect(trailing.toWorkspace("/home/me/notes/a.md")).toBe("a.md");
        expect(trailing.isRoot("/home/me/notes")).toBe(true);
    });

    it("handles the file system root", () => {
        const top = createNativePaths(root("/"));

        expect(top.toNative("a.md")).toBe("/a.md");
        expect(top.toWorkspace("/a.md")).toBe("a.md");
    });

    it("drops paths outside the root, including sibling prefixes", () => {
        expect(paths.toWorkspace("/home/me/other/a.md")).toBeNull();
        expect(paths.toWorkspace("/home/me/notes2/a.md")).toBeNull();
        expect(paths.toWorkspace("/home/me/notes")).toBeNull();
        expect(paths.toWorkspace("/home/me/notes/")).toBeNull();
    });

    it("drops names containing a backslash because they are not representable", () => {
        expect(paths.toWorkspace("/home/me/notes/a\\b.md")).toBeNull();
        expect(paths.toWorkspace("/home/me/notes/dir/a\\b.md")).toBeNull();
    });

    it("recognizes the root itself", () => {
        expect(paths.isRoot("/home/me/notes")).toBe(true);
        expect(paths.isRoot("/home/me/notes/")).toBe(true);
        expect(paths.isRoot("/home/me/notes/a.md")).toBe(false);
    });
});

describe("createNativePaths on Windows roots", () => {
    const paths = createNativePaths(root("C:\\Users\\me\\notes"));

    it("uses native separators outward and / inward", () => {
        expect(paths.toNative("a/b.md")).toBe("C:\\Users\\me\\notes\\a\\b.md");
        expect(paths.toWorkspace("C:\\Users\\me\\notes\\a\\b.md")).toBe(
            "a/b.md",
        );
    });

    it("compares the root case-insensitively but keeps the file name case", () => {
        expect(paths.toWorkspace("c:\\users\\ME\\Notes\\Sub\\A.md")).toBe(
            "Sub/A.md",
        );
        expect(paths.isRoot("C:\\USERS\\me\\notes\\")).toBe(true);
    });

    it("handles a drive root and drops other drives", () => {
        const drive = createNativePaths(root("D:\\"));

        expect(drive.toNative("a.md")).toBe("D:\\a.md");
        expect(drive.toWorkspace("D:\\a.md")).toBe("a.md");
        expect(drive.toWorkspace("C:\\a.md")).toBeNull();
    });

    it("drops paths outside the root", () => {
        expect(paths.toWorkspace("C:\\Users\\me\\notes2\\a.md")).toBeNull();
        expect(paths.toWorkspace("C:\\Users\\me\\a.md")).toBeNull();
    });
});
