import { describe, expect, it, vi } from "vitest";
import { createAttachments } from "./attachments";
import { MAX_IMAGE_BYTES } from "./images";
import { createInMemoryWorkspaceFileSystem } from "./testing";
import { toWorkspacePath, type WorkspacePath } from "./workspace-path";

function p(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(input);
    return result.value;
}

const PNG_HEAD = [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48,
    0x44, 0x52,
];
const be32 = (n: number) => [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
];
const png = (w: number, h: number) =>
    Uint8Array.from([...PNG_HEAD, ...be32(w), ...be32(h), 8, 6, 0, 0, 0]);

function setup() {
    const fs = createInMemoryWorkspaceFileSystem();
    return { fs, attachments: createAttachments({ fs }) };
}

describe("readImage", () => {
    it("returns bytes and info for a valid image", async () => {
        const { fs, attachments } = setup();
        fs.externalWrite(p("attachments/x.png"), png(3, 2));
        const result = await attachments.readImage(p("attachments/x.png"));
        expect(result).toEqual({
            ok: true,
            value: {
                bytes: png(3, 2),
                info: { format: "png", dimensions: { width: 3, height: 2 } },
            },
        });
    });

    it("passes not-found through", async () => {
        const { attachments } = setup();
        const result = await attachments.readImage(p("missing.png"));
        expect(result.ok === false && result.error.code).toBe("not-found");
    });

    it("refuses directories and symlinks", async () => {
        const { fs, attachments } = setup();
        fs.externalWrite(p("dir/x.png"), png(1, 1));
        fs.addSymlink(p("link.png"));
        for (const path of ["dir", "link.png"]) {
            const result = await attachments.readImage(p(path));
            expect(result.ok === false && result.error.code).toBe(
                "invalid-path",
            );
        }
    });

    it("rejects files over the byte limit without reading them", async () => {
        const { fs, attachments } = setup();
        fs.externalWrite(p("big.png"), new Uint8Array(MAX_IMAGE_BYTES + 1));
        const spy = vi.spyOn(fs, "readBytes");
        const result = await attachments.readImage(p("big.png"));
        expect(result.ok === false && result.error.code).toBe("too-large");
        expect(spy).not.toHaveBeenCalled();
    });

    it("reports unsupported bytes even with an image extension", async () => {
        const { fs, attachments } = setup();
        fs.externalWrite(
            p("fake.png"),
            new TextEncoder().encode("not an image"),
        );
        const result = await attachments.readImage(p("fake.png"));
        expect(result.ok === false && result.error.code).toBe("unsupported");
    });

    it("rejects images over the pixel limit", async () => {
        const { fs, attachments } = setup();
        fs.externalWrite(p("bomb.png"), png(20000, 20000));
        const result = await attachments.readImage(p("bomb.png"));
        expect(result.ok === false && result.error.code).toBe("too-large");
    });

    it("sniffs by bytes for a file without an image extension", async () => {
        const { fs, attachments } = setup();
        fs.externalWrite(p("diagram"), png(1, 1));
        const result = await attachments.readImage(p("diagram"));
        expect(result.ok).toBe(true);
    });
});

describe("addImage", () => {
    const now = new Date(2026, 9, 25, 14, 30, 12);

    function input(
        overrides: Partial<
            Parameters<ReturnType<typeof setup>["attachments"]["addImage"]>[0]
        > = {},
    ) {
        return {
            notePath: p("a.md"),
            bytes: png(2, 2),
            originalName: null,
            now,
            ...overrides,
        };
    }

    it("creates the folder on first use and returns the path and link text", async () => {
        const { fs, attachments } = setup();
        const result = await attachments.addImage(input());
        expect(result).toEqual({
            ok: true,
            value: {
                path: "attachments/Pasted image 20261025143012.png",
                linkText:
                    "![Pasted image 20261025143012](attachments/Pasted%20image%2020261025143012.png)",
            },
        });
        const stored = await fs.readBytes(
            p("attachments/Pasted image 20261025143012.png"),
        );
        expect(stored.ok && Array.from(stored.value)).toEqual(
            Array.from(png(2, 2)),
        );
    });

    it("builds a note-relative link for a note in a sub-folder", async () => {
        const { attachments } = setup();
        const result = await attachments.addImage(
            input({
                notePath: p("Projects/Plan.md"),
                originalName: "shot.png",
            }),
        );
        expect(result.ok && result.value.linkText).toBe(
            "![shot](../attachments/shot.png)",
        );
    });

    it("reuses an existing folder, takes names from readDir without a recursive list and never overwrites", async () => {
        const { fs, attachments } = setup();
        fs.externalWrite(p("attachments/shot.png"), png(9, 9));
        fs.externalWrite(p("deep/other/file.md"), new Uint8Array());
        const list = vi.spyOn(fs, "list");
        const mkdir = vi.spyOn(fs, "mkdir");
        const readDir = vi.spyOn(fs, "readDir");

        const result = await attachments.addImage(
            input({ originalName: "Shot.png" }),
        );

        expect(result.ok && result.value.path).toBe("attachments/Shot 1.png");
        expect(list).not.toHaveBeenCalled();
        expect(mkdir).not.toHaveBeenCalled();
        expect(readDir).toHaveBeenCalledWith("attachments");
        const original = await fs.readBytes(p("attachments/shot.png"));
        expect(original.ok && Array.from(original.value)).toEqual(
            Array.from(png(9, 9)),
        );
    });

    it("stores a JPEG named .png as .jpg and keeps .JPG", async () => {
        const { attachments } = setup();
        const jpeg = Uint8Array.from([
            0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, 0, 1, 0,
            1, 1, 1, 0x11, 0,
        ]);
        const renamed = await attachments.addImage(
            input({ bytes: jpeg, originalName: "photo.png" }),
        );
        const kept = await attachments.addImage(
            input({ bytes: jpeg, originalName: "IMG_1.JPG" }),
        );
        expect(renamed.ok && renamed.value.path).toBe("attachments/photo.jpg");
        expect(kept.ok && kept.value.path).toBe("attachments/IMG_1.JPG");
    });

    it("rejects too-large bytes, over-pixel images and unsupported data before touching the workspace", async () => {
        const { fs, attachments } = setup();
        const stat = vi.spyOn(fs, "stat");
        const big = await attachments.addImage(
            input({ bytes: new Uint8Array(MAX_IMAGE_BYTES + 1) }),
        );
        const bomb = await attachments.addImage(
            input({ bytes: png(20000, 20000) }),
        );
        const text = await attachments.addImage(
            input({
                bytes: new TextEncoder().encode("hello"),
                originalName: "x.png",
            }),
        );
        expect(!big.ok && big.error.code).toBe("too-large");
        expect(!bomb.ok && bomb.error.code).toBe("too-large");
        expect(!text.ok && text.error.code).toBe("unsupported");
        expect(stat).not.toHaveBeenCalled();
    });

    it("returns a folder stat error other than not-found without mkdir", async () => {
        const { fs, attachments } = setup();
        vi.spyOn(fs, "stat").mockResolvedValue({
            ok: false,
            error: { code: "permission-denied", message: "no" },
        });
        const mkdir = vi.spyOn(fs, "mkdir");
        const result = await attachments.addImage(input());
        expect(!result.ok && result.error.code).toBe("permission-denied");
        expect(mkdir).not.toHaveBeenCalled();
    });

    it("rejects an attachments entry that is a file or a symlink", async () => {
        for (const kind of ["file", "symlink"]) {
            const { fs, attachments } = setup();
            if (kind === "file")
                fs.externalWrite(p("attachments"), new Uint8Array([1]));
            else fs.addSymlink(p("attachments"));
            const result = await attachments.addImage(input());
            expect(!result.ok && result.error.code).toBe("invalid-path");
            const list = await fs.list();
            expect(list.ok && list.value).toHaveLength(1);
        }
    });

    it("retries with the losing name taken after an already-exists race, then gives up after 5 attempts", async () => {
        const raced = setup();
        const create = vi.spyOn(raced.fs, "createExclusive");
        create.mockResolvedValueOnce({
            ok: false,
            error: { code: "already-exists", message: "race" },
        });
        const result = await raced.attachments.addImage(
            input({ originalName: "x.png" }),
        );
        expect(result.ok && result.value.path).toBe("attachments/x 1.png");
        expect(create.mock.calls.map((call) => call[0])).toEqual([
            "attachments/x.png",
            "attachments/x 1.png",
        ]);

        const stuck = setup();
        const always = vi.spyOn(stuck.fs, "createExclusive").mockResolvedValue({
            ok: false,
            error: { code: "already-exists", message: "race" },
        });
        const gaveUp = await stuck.attachments.addImage(
            input({ originalName: "x.png" }),
        );
        expect(!gaveUp.ok && gaveUp.error.code).toBe("already-exists");
        expect(always).toHaveBeenCalledTimes(5);
    });

    it("returns another write error without retrying", async () => {
        const { fs, attachments } = setup();
        const create = vi.spyOn(fs, "createExclusive").mockResolvedValue({
            ok: false,
            error: { code: "unknown", message: "disk full" },
        });
        const result = await attachments.addImage(input());
        expect(!result.ok && result.error.code).toBe("unknown");
        expect(create).toHaveBeenCalledTimes(1);
    });

    it("creates nothing in a read-only workspace", async () => {
        const fs = createInMemoryWorkspaceFileSystem({ readOnly: true });
        const result = await createAttachments({ fs }).addImage(input());
        expect(!result.ok && result.error.code).toBe("permission-denied");
        const list = await fs.list();
        expect(list.ok && list.value).toEqual([]);
    });
});
