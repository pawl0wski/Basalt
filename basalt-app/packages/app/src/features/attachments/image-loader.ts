import {
    IMAGE_FORMATS,
    pathKey,
    resolveLinkTarget,
    type AppErrorCode,
    type Attachments,
    type FileStat,
    type Result,
    type WorkspacePath,
} from "@basalt/core";

export const IMAGE_CACHE_BUDGET_BYTES = 256 * 1024 * 1024;

export type ImageLoadFailure =
    "remote" | "invalid" | "unsupported-scheme" | AppErrorCode;

export type ImageLoadResult =
    | {
          readonly kind: "image";
          readonly src: string;
          readonly dimensions: {
              readonly width: number;
              readonly height: number;
          } | null;
      }
    | { readonly kind: "failed"; readonly reason: ImageLoadFailure };

type Fingerprint = "missing" | Pick<FileStat, "kind" | "size" | "mtimeMs">;

type Entry = {
    readonly path: WorkspacePath;
    promise: Promise<ImageLoadResult>;
    result: ImageLoadResult | null;
    fingerprint: Fingerprint;
    bytes: number;
    useCount: number;
    lastUsed: number;
};

export type ImageLoaderOptions = {
    readonly attachments: Pick<Attachments, "readImage">;
    readonly stat: (path: WorkspacePath) => Promise<Result<FileStat>>;
    readonly notePath: WorkspacePath;
    readonly budgetBytes?: number;
    readonly createObjectUrl?: (blob: Blob) => string;
    readonly revokeObjectUrl?: (url: string) => void;
};

export type ImageLoader = {
    load(destination: string): Promise<ImageLoadResult>;
    release(destination: string): void;
    invalidate(paths: readonly WorkspacePath[]): boolean;
    revalidate(): Promise<boolean>;
    dispose(): void;
};

function fingerprintOf(stat: Result<FileStat>): Fingerprint {
    if (!stat.ok) return "missing";
    const { kind, size, mtimeMs } = stat.value;
    return { kind, size, mtimeMs };
}

function sameFingerprint(a: Fingerprint, b: Fingerprint): boolean {
    if (a === "missing" || b === "missing") return a === b;
    return a.kind === b.kind && a.size === b.size && a.mtimeMs === b.mtimeMs;
}

export function createImageLoader(options: ImageLoaderOptions): ImageLoader {
    const budget = options.budgetBytes ?? IMAGE_CACHE_BUDGET_BYTES;
    const createUrl =
        options.createObjectUrl ?? ((blob) => URL.createObjectURL(blob));
    const revokeUrl =
        options.revokeObjectUrl ?? ((url) => URL.revokeObjectURL(url));
    const entries = new Map<WorkspacePath, Entry>();
    const retired = new Map<WorkspacePath, string[]>();
    let tick = 0;

    function urlOf(entry: Entry): string | null {
        return entry.result?.kind === "image" ? entry.result.src : null;
    }

    function retire(entry: Entry): void {
        entries.delete(entry.path);
        const url = urlOf(entry);
        if (url === null) return;
        retired.set(entry.path, [...(retired.get(entry.path) ?? []), url]);
    }

    function revokeRetired(path: WorkspacePath): void {
        for (const url of retired.get(path) ?? []) revokeUrl(url);
        retired.delete(path);
    }

    function enforceBudget(): void {
        let total = 0;
        for (const entry of entries.values()) total += entry.bytes;
        while (total > budget) {
            let victim: Entry | null = null;
            for (const entry of entries.values()) {
                if (
                    entry.result === null ||
                    entry.useCount > 0 ||
                    entry.bytes === 0
                )
                    continue;
                if (victim === null || entry.lastUsed < victim.lastUsed)
                    victim = entry;
            }
            if (victim === null) return;
            entries.delete(victim.path);
            const url = urlOf(victim);
            if (url !== null) revokeUrl(url);
            total -= victim.bytes;
        }
    }

    async function read(
        path: WorkspacePath,
        entry: () => Entry | undefined,
    ): Promise<ImageLoadResult> {
        const read = await options.attachments.readImage(path);
        let result: ImageLoadResult;
        let bytes = 0;
        if (read.ok) {
            const blob = new Blob([read.value.bytes.slice()], {
                type: IMAGE_FORMATS[read.value.info.format].mime,
            });
            result = {
                kind: "image",
                src: createUrl(blob),
                dimensions: read.value.info.dimensions,
            };
            bytes = read.value.bytes.length;
        } else {
            result = { kind: "failed", reason: read.error.code };
        }
        const current = entry();
        if (current) {
            current.result = result;
            current.bytes = bytes;
            revokeRetired(path);
            enforceBudget();
        } else if (result.kind === "image") {
            retired.set(path, [...(retired.get(path) ?? []), result.src]);
        }
        return result;
    }

    function load(destination: string): Promise<ImageLoadResult> {
        const target = resolveLinkTarget(options.notePath, destination);
        if (target.kind !== "workspace") {
            return Promise.resolve({
                kind: "failed",
                reason:
                    target.kind === "remote"
                        ? "remote"
                        : target.kind === "invalid"
                          ? "invalid"
                          : "unsupported-scheme",
            });
        }
        const path = target.path;
        const existing = entries.get(path);
        if (existing) {
            existing.useCount += 1;
            existing.lastUsed = ++tick;
            return existing.promise;
        }
        const created: Entry = {
            path,
            promise: Promise.resolve({ kind: "failed", reason: "unknown" }),
            result: null,
            fingerprint: "missing",
            bytes: 0,
            useCount: 1,
            lastUsed: ++tick,
        };
        created.promise = (async () => {
            created.fingerprint = fingerprintOf(await options.stat(path));
            return read(path, () =>
                entries.get(path) === created ? created : undefined,
            );
        })();
        entries.set(path, created);
        return created.promise;
    }

    function release(destination: string): void {
        const target = resolveLinkTarget(options.notePath, destination);
        if (target.kind !== "workspace") return;
        const entry = entries.get(target.path);
        if (entry) entry.useCount = Math.max(0, entry.useCount - 1);
    }

    function invalidate(paths: readonly WorkspacePath[]): boolean {
        const keys = paths.map(pathKey);
        let dropped = false;
        for (const entry of [...entries.values()]) {
            const key = pathKey(entry.path);
            if (
                keys.some(
                    (changed) =>
                        key === changed || key.startsWith(`${changed}/`),
                )
            ) {
                retire(entry);
                dropped = true;
            }
        }
        return dropped;
    }

    async function revalidate(): Promise<boolean> {
        let dropped = false;
        for (const entry of [...entries.values()]) {
            if (entry.result === null) continue;
            const fingerprint = fingerprintOf(await options.stat(entry.path));
            if (entries.get(entry.path) !== entry) continue;
            if (!sameFingerprint(fingerprint, entry.fingerprint)) {
                retire(entry);
                dropped = true;
            }
        }
        return dropped;
    }

    function dispose(): void {
        for (const entry of entries.values()) {
            const url = urlOf(entry);
            if (url !== null) revokeUrl(url);
        }
        entries.clear();
        for (const urls of retired.values())
            for (const url of urls) revokeUrl(url);
        retired.clear();
    }

    return { load, release, invalidate, revalidate, dispose };
}
