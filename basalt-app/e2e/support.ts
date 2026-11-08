import type { Page } from "@playwright/test";

export type TestFs = {
    seedWorkspace(
        root: string,
        files: Record<string, string | Uint8Array>,
    ): void;
    setPickerResult(root: string | null | undefined): void;
    setReadOnly(readOnly: boolean): void;
    setFailWatch(failWatch: boolean): void;
    failNextWrite(): void;
    listFiles(): string[];
    readBytes(path: string): Uint8Array | null;
    externalWrite(path: string, bytes: Uint8Array): void;
    externalDelete(path: string): void;
    removeRoot(): void;
};

declare global {
    interface Window {
        __basaltTestFs?: TestFs;
    }
}

export const OPEN_FOLDER = { name: "Open folder as workspace" };

export const SIDEBAR = { name: "Workspace" };

export async function gotoWelcome(page: Page): Promise<void> {
    await page.goto("/");
    await page.getByRole("button", OPEN_FOLDER).waitFor();
    await page.waitForFunction(() => Boolean(window.__basaltTestFs));
}

export async function openWorkspaceWith(
    page: Page,
    root: string,
    files: Record<string, string | Uint8Array>,
    flags: { readOnly?: boolean; failWatch?: boolean } = {},
): Promise<void> {
    await gotoWelcome(page);
    await page.evaluate(
        ({ root, files, flags }) => {
            const fs = window.__basaltTestFs;
            if (!fs) throw new Error("The test handle is missing.");
            const decoded = Object.fromEntries(
                Object.entries(files).map(([name, content]) => [
                    name,
                    typeof content === "string"
                        ? content
                        : Uint8Array.from(content),
                ]),
            );
            fs.seedWorkspace(root, decoded);
            fs.setPickerResult(root);
            fs.setReadOnly(flags.readOnly ?? false);
            fs.setFailWatch(flags.failWatch ?? false);
        },
        {
            root,
            files: Object.fromEntries(
                Object.entries(files).map(([name, content]) => [
                    name,
                    typeof content === "string" ? content : Array.from(content),
                ]),
            ),
            flags,
        },
    );
    await page.getByRole("button", OPEN_FOLDER).click();
    await page.getByRole("navigation", SIDEBAR).waitFor();
}

export async function externalWrite(
    page: Page,
    path: string,
    text: string,
): Promise<void> {
    await page.evaluate(
        ({ path, text }) => {
            window.__basaltTestFs?.externalWrite(
                path,
                new TextEncoder().encode(text),
            );
        },
        { path, text },
    );
}

export async function externalDelete(page: Page, path: string): Promise<void> {
    await page.evaluate((target) => {
        window.__basaltTestFs?.externalDelete(target);
    }, path);
}

export async function readSavedBytes(
    page: Page,
    path: string,
): Promise<number[] | null> {
    return page.evaluate((target) => {
        const bytes = window.__basaltTestFs?.readBytes(target);
        return bytes ? Array.from(bytes) : null;
    }, path);
}

export async function readSavedText(
    page: Page,
    path: string,
): Promise<string | null> {
    const bytes = await readSavedBytes(page, path);
    return bytes ? new TextDecoder().decode(Uint8Array.from(bytes)) : null;
}

export async function failNextWrite(page: Page): Promise<void> {
    await page.evaluate(() => {
        window.__basaltTestFs?.failNextWrite();
    });
}

export async function setReadOnly(
    page: Page,
    readOnly: boolean,
): Promise<void> {
    await page.evaluate((value) => {
        window.__basaltTestFs?.setReadOnly(value);
    }, readOnly);
}

export async function removeRoot(page: Page): Promise<void> {
    await page.evaluate(() => {
        window.__basaltTestFs?.removeRoot();
    });
}
