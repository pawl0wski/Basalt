import { describe, expect, it } from "vitest";
import { FILE_KINDS, fileKindOf, type FileKindDefinition } from "./file-kinds";

describe("fileKindOf", () => {
    it.each([
        ["a.md", "markdown"],
        ["dir/B.MD", "markdown"],
        ["x.png", "image"],
        ["x.PNG", "image"],
        ["a/b.JpG", "image"],
        ["x.jpeg", "image"],
        ["x.gif", "image"],
        ["x.webp", "image"],
        ["x.avif", "image"],
        ["x.svg", "image"],
    ])("%s is %s", (path, kind) => {
        expect(fileKindOf(path)).toBe(kind);
    });

    it.each(["a.markdown", "a.md.txt", "md", "png", "a.heic", "dir.md/file"])(
        "%s has no kind",
        (path) => {
            expect(fileKindOf(path)).toBeNull();
        },
    );

    it("lets the longest extension win regardless of list order", () => {
        const kinds: readonly FileKindDefinition<string>[] = [
            ...FILE_KINDS,
            { id: "drawio", extensions: [".drawio.svg"] },
        ];
        expect(fileKindOf("board.drawio.svg", kinds)).toBe("drawio");
        expect(fileKindOf("board.svg", kinds)).toBe("image");
        expect(fileKindOf("board.drawio.svg", [...kinds].reverse())).toBe(
            "drawio",
        );
    });
});
