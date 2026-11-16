import {
    MAX_IMAGE_BYTES,
    createAttachments,
    toWorkspacePath,
    type WorkspacePath,
} from "@basalt/core";
import { createInMemoryWorkspaceFileSystem } from "@basalt/core/testing";
import { describe, expect, it, vi } from "vitest";
import { addImagesFromFiles } from "./add-images";

function p(input: string): WorkspacePath {
    const result = toWorkspacePath(input);
    if (!result.ok) throw new Error(input);
    return result.value;
}

const be32 = (n: number) => [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
];
const PNG = Uint8Array.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    0,
    0,
    0,
    13,
    0x49,
    0x48,
    0x44,
    0x52,
    ...be32(1),
    ...be32(1),
    8,
    6,
    0,
    0,
    0,
]);
function file(content: Uint8Array | string, name: string): File {
    const bytes =
        typeof content === "string"
            ? new TextEncoder().encode(content)
            : content;
    return Object.assign(new File([bytes.slice().buffer], name), {
        arrayBuffer: async () => bytes.slice().buffer,
    });
}

const now = () => new Date(2026, 9, 25, 14, 30, 12);

function setup() {
    const fs = createInMemoryWorkspaceFileSystem();
    return { fs, attachments: createAttachments({ fs }) };
}

describe("addImagesFromFiles", () => {
    it("adds every image and returns the links in order", async () => {
        const { fs, attachments } = setup();
        const outcome = await addImagesFromFiles({
            files: [file(PNG, "one.png"), file(PNG, "two.png")],
            notePath: p("a.md"),
            attachments,
            now,
        });
        expect(outcome).toEqual({
            links: [
                "![one](attachments/one.png)",
                "![two](attachments/two.png)",
            ],
            failed: 0,
            firstFailure: null,
        });
        const stored = await fs.readBytes(p("attachments/two.png"));
        expect(stored.ok && Array.from(stored.value)).toEqual(Array.from(PNG));
    });

    it("names an unnamed clipboard file by time", async () => {
        const { attachments } = setup();
        const outcome = await addImagesFromFiles({
            files: [file(PNG, "")],
            notePath: p("a.md"),
            attachments,
            now,
        });
        expect(outcome.links).toEqual([
            "![Pasted image 20261025143012](attachments/Pasted%20image%2020261025143012.png)",
        ]);
    });

    it("keeps successes, counts failures and reports the first reason", async () => {
        const { attachments } = setup();
        const outcome = await addImagesFromFiles({
            files: [
                file("%PDF", "doc.pdf"),
                file(PNG, "ok.png"),
                file("text", "fake.png"),
            ],
            notePath: p("a.md"),
            attachments,
            now,
        });
        expect(outcome.links).toEqual(["![ok](attachments/ok.png)"]);
        expect(outcome.failed).toBe(2);
        expect(outcome.firstFailure).toBe("unsupported");
    });

    it("rejects oversize files from File.size without reading them", async () => {
        const { attachments } = setup();
        const big = file(PNG, "big.png");
        Object.defineProperty(big, "size", { value: MAX_IMAGE_BYTES + 1 });
        const arrayBuffer = vi.spyOn(big, "arrayBuffer");
        const addImage = vi.spyOn(attachments, "addImage");
        const outcome = await addImagesFromFiles({
            files: [big],
            notePath: p("a.md"),
            attachments,
            now,
        });
        expect(outcome).toEqual({
            links: [],
            failed: 1,
            firstFailure: "too-large",
        });
        expect(arrayBuffer).not.toHaveBeenCalled();
        expect(addImage).not.toHaveBeenCalled();
    });

    it("counts a file that cannot be read", async () => {
        const { attachments } = setup();
        const broken = file(PNG, "x.png");
        vi.spyOn(broken, "arrayBuffer").mockRejectedValue(new Error("gone"));
        const outcome = await addImagesFromFiles({
            files: [broken],
            notePath: p("a.md"),
            attachments,
            now,
        });
        expect(outcome).toEqual({
            links: [],
            failed: 1,
            firstFailure: "unknown",
        });
    });

    it("reports permission-denied in a read-only workspace and creates nothing", async () => {
        const fs = createInMemoryWorkspaceFileSystem({ readOnly: true });
        const outcome = await addImagesFromFiles({
            files: [file(PNG, "x.png")],
            notePath: p("a.md"),
            attachments: createAttachments({ fs }),
            now,
        });
        expect(outcome.links).toEqual([]);
        expect(outcome.firstFailure).toBe("permission-denied");
        const list = await fs.list();
        expect(list.ok && list.value).toEqual([]);
    });

    it("reads files one at a time", async () => {
        const { attachments } = setup();
        const order: string[] = [];
        const original = attachments.addImage.bind(attachments);
        vi.spyOn(attachments, "addImage").mockImplementation(async (input) => {
            order.push(`start ${input.originalName}`);
            const result = await original(input);
            order.push(`end ${input.originalName}`);
            return result;
        });
        await addImagesFromFiles({
            files: [file(PNG, "a.png"), file(PNG, "b.png")],
            notePath: p("a.md"),
            attachments,
            now,
        });
        expect(order).toEqual([
            "start a.png",
            "end a.png",
            "start b.png",
            "end b.png",
        ]);
    });
});
