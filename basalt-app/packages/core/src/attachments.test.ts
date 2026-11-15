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
