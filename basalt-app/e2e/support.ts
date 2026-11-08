import type { Page } from "@playwright/test";

export type TestFs = {
    seedWorkspace(root: string, files: Record<string, string>): void;
    setPickerResult(root: string | null | undefined): void;
    setReadOnly(readOnly: boolean): void;
    setFailWatch(failWatch: boolean): void;
    listFiles(): string[];
    externalWrite(path: string, bytes: Uint8Array): void;
    externalDelete(path: string): void;
};

declare global {
    interface Window {
        __basaltTestFs?: TestFs;
    }
}

export const OPEN_FOLDER = { name: "Open folder as workspace" };

export const SIDEBAR = { name: "Workspace" };

export async function openWorkspaceWith(
    page: Page,
    root: string,
    files: Record<string, string>,
    flags: { readOnly?: boolean; failWatch?: boolean } = {},
): Promise<void> {
    await page.goto("/");
    await page.getByRole("button", OPEN_FOLDER).waitFor();
    await page.evaluate(
        ({ root, files, flags }) => {
            const fs = window.__basaltTestFs;
            if (!fs) throw new Error("The test handle is missing.");
            fs.seedWorkspace(root, files);
            fs.setPickerResult(root);
            fs.setReadOnly(flags.readOnly ?? false);
            fs.setFailWatch(flags.failWatch ?? false);
        },
        { root, files, flags },
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
