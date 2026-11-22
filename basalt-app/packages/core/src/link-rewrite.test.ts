import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rewriteLinksTo, rewriteRelativeLinks } from "./link-rewrite";
import { buildRelativeLink, resolveLinkTarget } from "./links";
import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

function p(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(input);
    return result.value;
}

const move = (text: string, from: string, to: string) =>
    rewriteRelativeLinks(text, p(from), p(to));

describe("rewriteRelativeLinks", () => {
    it("rewrites inline links and images when the note moves one folder deeper", () => {
        const text = "See [plan](plan.md) and ![pic](attachments/a.png).";

        expect(move(text, "note.md", "docs/note.md")).toBe(
            "See [plan](../plan.md) and ![pic](../attachments/a.png).",
        );
    });

    it("rewrites when the note moves out of a folder to the root", () => {
        expect(move("[x](../a.md) [y](sub/b.md)", "docs/n.md", "n.md")).toBe(
            "[x](a.md) [y](docs/sub/b.md)",
        );
    });

    it("keeps the width suffix of an image alt text when the note moves", () => {
        expect(move("![photo|300](img/x.png)", "a/n.md", "b/n.md")).toBe(
            "![photo|300](../a/img/x.png)",
        );
    });

    it("rewrites when the note moves between sibling folders", () => {
        expect(move("![i](img/x.png)", "a/n.md", "b/n.md")).toBe(
            "![i](../a/img/x.png)",
        );
    });

    it("rewrites link reference definitions and keeps the title", () => {
        const text = '[ref]: ../shared/x.md "Title"\n\n[ref]\n';

        expect(move(text, "a/n.md", "n.md")).toBe(
            '[ref]: shared/x.md "Title"\n\n[ref]\n',
        );
    });

    it("keeps titles of inline links and images", () => {
        expect(move("[a](x.md \"T\") ![b](y.png 'U')", "n.md", "d/n.md")).toBe(
            "[a](../x.md \"T\") ![b](../y.png 'U')",
        );
    });

    it("keeps the fragment and the query of a rewritten destination", () => {
        expect(move("[a](x.md#head) [b](y.md?v=1#z)", "n.md", "d/n.md")).toBe(
            "[a](../x.md#head) [b](../y.md?v=1#z)",
        );
    });

    it("re-encodes names that need it and keeps angle brackets", () => {
        expect(move("[a](<my note.md>)", "n.md", "d/n.md")).toBe(
            "[a](<../my%20note.md>)",
        );
        expect(move("[a](my%20note.md)", "n.md", "d/n.md")).toBe(
            "[a](../my%20note.md)",
        );
    });

    it("handles parentheses in file names", () => {
        expect(move("[a](a(b).md)", "n.md", "d/n.md")).toBe(
            "[a](../a%28b%29.md)",
        );
    });

    it("leaves remote, unsupported-scheme and invalid destinations byte-for-byte", () => {
        const text = [
            "[a](https://example.com/x.md)",
            "[b](mailto:me@example.com)",
            "[c](file:///etc/passwd)",
            "[d](/abs/path.md)",
            "[e](#heading)",
            "[f](..\\win.md)",
            "[g](../../escape.md)",
            "[h](%E0%A4%A.md)",
            "[i](<>)",
            "<https://auto.link/x>",
            "[j]: http://example.com/ref",
        ].join("\n");

        expect(move(text, "n.md", "d/n.md")).toBe(text);
    });

    it("does not touch links in code spans, fenced code or indented code", () => {
        const text = [
            "`[a](x.md)`",
            "",
            "```",
            "[b](y.md)",
            "![c](z.png)",
            "```",
            "",
            "    [d](w.md)",
            "",
            "[real](r.md)",
        ].join("\n");

        expect(move(text, "n.md", "d/n.md")).toBe(
            text.replace("[real](r.md)", "[real](../r.md)"),
        );
    });

    it("does not rewrite raw HTML or bare text that merely looks like a path", () => {
        const text = '<img src="x.png"> and x.md and (y.md)';

        expect(move(text, "n.md", "d/n.md")).toBe(text);
    });

    it("leaves escaped brackets alone", () => {
        const text = "\\[a\\](x.md) and [b\\](y.md)";

        expect(move(text, "n.md", "d/n.md")).toBe(text);
    });

    it("rewrites links inside tables, lists and quotes", () => {
        const text =
            "| a | [t](p.md) |\n|---|---|\n\n- [l](q.md)\n\n> ![i](r.png)";

        expect(move(text, "n.md", "d/n.md")).toBe(
            "| a | [t](../p.md) |\n|---|---|\n\n- [l](../q.md)\n\n> ![i](../r.png)",
        );
    });

    it("rewrites every link of several on one line without shifting offsets", () => {
        expect(move("[a](x.md)[b](y.md)![c](z.png)", "n.md", "d/n.md")).toBe(
            "[a](../x.md)[b](../y.md)![c](../z.png)",
        );
    });

    it("returns the text unchanged for a rename within the same folder", () => {
        const text = "[a](x.md) ![b](../y.png)";

        expect(move(text, "d/old.md", "d/new.md")).toBe(text);
        expect(move(text, "old.md", "new.md")).toBe(text);
    });

    it("preserves text around links, line endings and non-ASCII content", () => {
        const text = "Zażółć\r\n\r\n[a](x.md)\r\n";

        expect(move(text, "n.md", "d/n.md")).toBe(
            "Zażółć\r\n\r\n[a](../x.md)\r\n",
        );
    });

    it("returns an empty text unchanged", () => {
        expect(move("", "n.md", "d/n.md")).toBe("");
    });

    describe("round trip", () => {
        const segment = fc.constantFrom(
            "a",
            "b",
            "my note",
            "Zażółć",
            "x(1)",
            "100%",
            "#tag",
            "q?",
        );
        const folder = fc.array(segment, { maxLength: 3 });
        const file = fc.constantFrom("n.md", "t.md", "img.png");

        it("keeps every relative link pointing at the same target", () => {
            fc.assert(
                fc.property(
                    folder,
                    folder,
                    folder,
                    file,
                    fc.boolean(),
                    (oldFolder, newFolder, targetFolder, name, angle) => {
                        const oldNote = p([...oldFolder, "old.md"].join("/"));
                        const newNote = p([...newFolder, "new.md"].join("/"));
                        const target = p([...targetFolder, name].join("/"));
                        const destination = buildRelativeLink(oldNote, target);
                        const wrapped = angle
                            ? `<${destination}>`
                            : destination;
                        const text = `[a](${wrapped} "t")\n![b](${wrapped})\n\n[r]: ${wrapped}\n`;

                        const result = rewriteRelativeLinks(
                            text,
                            oldNote,
                            newNote,
                        );

                        const destinations = [
                            ...result.matchAll(
                                /\]\(<?([^)>\s]*)>?(?: "t")?\)|\]: <?(\S+?)>?\n/g,
                            ),
                        ].map((match) => match[1] ?? match[2] ?? "");
                        expect(destinations).toHaveLength(3);
                        for (const found of destinations) {
                            expect(resolveLinkTarget(newNote, found)).toEqual({
                                kind: "workspace",
                                path: target,
                            });
                        }
                    },
                ),
            );
        });

        it("is reversible: moving back restores the original resolution", () => {
            fc.assert(
                fc.property(folder, folder, folder, (a, b, t) => {
                    const first = p([...a, "n.md"].join("/"));
                    const second = p([...b, "n.md"].join("/"));
                    const target = p([...t, "t.md"].join("/"));
                    const text = `[l](${buildRelativeLink(first, target)})`;

                    const there = rewriteRelativeLinks(text, first, second);
                    const back = rewriteRelativeLinks(there, second, first);

                    expect(back).toBe(text);
                }),
            );
        });
    });
});

describe("rewriteRelativeLinks with a target remap", () => {
    const remap = (target: string) =>
        target.startsWith("a/f/")
            ? (`b/f/${target.slice("a/f/".length)}` as ReturnType<typeof p>)
            : p(target);

    it("rebuilds a link into the moved subtree from the new note location", () => {
        expect(
            rewriteRelativeLinks(
                "[x](sub/two.md)",
                p("a/f/one.md"),
                p("b/f/one.md"),
                remap,
            ),
        ).toBe("[x](sub/two.md)");
    });

    it("rebuilds a link that leaves the subtree", () => {
        expect(
            rewriteRelativeLinks(
                "[x](../side.md)",
                p("a/f/one.md"),
                p("b/f/one.md"),
                remap,
            ),
        ).toBe("[x](../../a/side.md)");
    });

    it("rewrites with a remap even when the note keeps its directory", () => {
        expect(
            rewriteRelativeLinks(
                "[x](../x.md)",
                p("a/f/one.md"),
                p("a/f/one.md"),
                () => p("z.md"),
            ),
        ).toBe("[x](../../z.md)");
    });

    it("keeps the existing behavior without a remap for same-folder moves", () => {
        expect(
            rewriteRelativeLinks("[x](a.md)", p("d/n.md"), p("d/m.md")),
        ).toBe("[x](a.md)");
    });
});

describe("rewriteLinksTo", () => {
    const to = (text: string, note: string, from: string, target: string) =>
        rewriteLinksTo(text, p(note), p(from), p(target));

    it("rewrites links, images and reference definitions that point to the old note", () => {
        expect(
            to(
                "[a](old.md) ![b](old.md) [c][r]\n\n[r]: old.md",
                "n.md",
                "old.md",
                "New.md",
            ),
        ).toBe("[a](New.md) ![b](New.md) [c][r]\n\n[r]: New.md");
    });

    it("leaves links to other notes and unrelated text untouched", () => {
        const text = "[a](other.md) and old.md and `[x](old.md)`";
        expect(to(text, "n.md", "old.md", "New.md")).toBe(
            "[a](other.md) and old.md and `[x](old.md)`",
        );
    });

    it("resolves the link from the note's own folder", () => {
        expect(to("[a](../old.md)", "dir/n.md", "old.md", "New name.md")).toBe(
            "[a](../New%20name.md)",
        );
        expect(to("[a](old.md)", "dir/n.md", "old.md", "New.md")).toBe(
            "[a](old.md)",
        );
    });

    it("keeps the fragment, the query and the angle brackets", () => {
        expect(to("[a](old.md#sec)", "n.md", "old.md", "New.md")).toBe(
            "[a](New.md#sec)",
        );
        expect(to("[a](<old%20x.md?q=1>)", "n.md", "old x.md", "New.md")).toBe(
            "[a](<New.md?q=1>)",
        );
    });

    it("leaves remote, unsupported and invalid destinations byte for byte", () => {
        const text =
            "[a](https://x.test/old.md) [b](mailto:old.md) [c](/old.md) [d]()";
        expect(to(text, "n.md", "old.md", "New.md")).toBe(text);
    });

    it("returns the text unchanged when the target does not change", () => {
        expect(to("[a](old.md)", "n.md", "old.md", "old.md")).toBe(
            "[a](old.md)",
        );
    });

    it("is idempotent", () => {
        const once = to("[a](old.md)", "n.md", "old.md", "New.md");
        expect(to(once, "n.md", "old.md", "New.md")).toBe(once);
    });
});
