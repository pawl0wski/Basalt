import {
    MAX_IMAGE_BYTES,
    type AppErrorCode,
    type Attachments,
    type WorkspacePath,
} from "@basalt/core";

export type AddImagesOutcome = {
    readonly links: readonly string[];
    readonly failed: number;
    readonly firstFailure: AppErrorCode | null;
};

export async function addImagesFromFiles(input: {
    files: readonly File[];
    notePath: WorkspacePath;
    attachments: Pick<Attachments, "addImage">;
    now: () => Date;
}): Promise<AddImagesOutcome> {
    const links: string[] = [];
    let failed = 0;
    let firstFailure: AppErrorCode | null = null;
    const fail = (code: AppErrorCode) => {
        failed += 1;
        firstFailure ??= code;
    };
    for (const file of input.files) {
        if (file.size > MAX_IMAGE_BYTES) {
            fail("too-large");
            continue;
        }
        let bytes: Uint8Array;
        try {
            bytes = new Uint8Array(await file.arrayBuffer());
        } catch {
            fail("unknown");
            continue;
        }
        const added = await input.attachments.addImage({
            notePath: input.notePath,
            bytes,
            originalName: file.name === "" ? null : file.name,
            now: input.now(),
        });
        if (added.ok) links.push(added.value.linkText);
        else fail(added.error.code);
    }
    return { links, failed, firstFailure };
}
