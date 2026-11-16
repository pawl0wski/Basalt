export interface BasaltTestFs {
    seedWorkspace(
        root: string,
        files: Readonly<Record<string, string | Uint8Array>>,
    ): void;
    setPickerResult(root: string | null | undefined): void;
    setReadOnly(readOnly: boolean): void;
    setScopeDenied(prefix: string | null): void;
    setFailWatch(failWatch: boolean): void;
    failNextWrite(): void;
    listFiles(): string[];
    readBytes(path: string): Uint8Array | null;
    externalWrite(path: string, bytes: Uint8Array): void;
    externalDelete(path: string): void;
    removeRoot(): void;
}

declare global {
    interface Window {
        __basaltTestFs?: BasaltTestFs;
    }
}
