import type { AutosaveScheduler } from "./autosave";
import { isMarkdownPath, type Eol, type NoteService } from "./notes";
import type { WorkspaceFileSystem } from "./ports";
import type { AppError } from "./result";
import { pathKey, type WorkspacePath } from "./workspace-path";

export type WatchMode = "live" | "focus-fallback";

export type WorkspaceWatcherHandlers = {
    readonly onBatch: (paths: readonly WorkspacePath[]) => void;
    readonly onRootLost: () => void;
};

export type WorkspaceWatcherOptions = {
    readonly fs: WorkspaceFileSystem;
    readonly schedule: AutosaveScheduler;
    readonly debounceMs: number;
};

export type WorkspaceWatcher = {
    start(handlers: WorkspaceWatcherHandlers): Promise<WatchMode>;
    stop(): Promise<void>;
};

export function createWorkspaceWatcher(
    options: WorkspaceWatcherOptions,
): WorkspaceWatcher {
    const { fs, schedule, debounceMs } = options;
    let pending = new Set<WorkspacePath>();
    let cancelTimer: (() => void) | null = null;
    let unwatch: (() => Promise<void>) | null = null;
    let handlers: WorkspaceWatcherHandlers | null = null;
    let stopped = false;

    function clearPending(): void {
        cancelTimer?.();
        cancelTimer = null;
        pending = new Set();
    }

    function flush(): void {
        cancelTimer = null;
        const paths = [...pending];
        pending = new Set();
        if (paths.length > 0) handlers?.onBatch(paths);
    }

    async function start(next: WorkspaceWatcherHandlers): Promise<WatchMode> {
        handlers = next;
        const watching = await fs.watch((event) => {
            if (stopped) return;
            if (event.kind === "root-lost") {
                clearPending();
                handlers?.onRootLost();
                return;
            }
            for (const path of event.paths) pending.add(path);
            if (cancelTimer === null && pending.size > 0) {
                cancelTimer = schedule(flush, debounceMs);
            }
        });
        if (!watching.ok) return "focus-fallback";
        if (stopped) {
            await watching.value();
            return "focus-fallback";
        }
        unwatch = watching.value;
        return "live";
    }

    async function stop(): Promise<void> {
        stopped = true;
        clearPending();
        const release = unwatch;
        unwatch = null;
        handlers = null;
        await release?.();
    }

    return { start, stop };
}

export type OpenNoteChange =
    | { readonly kind: "ignore" }
    | {
          readonly kind: "reload";
          readonly text: string;
          readonly baseText: string;
          readonly eol: Eol;
          readonly bom: boolean;
      }
    | { readonly kind: "conflict" }
    | { readonly kind: "not-found" }
    | { readonly kind: "error"; readonly error: AppError };

export type OpenNoteChangeInput = {
    readonly notes: Pick<NoteService, "openNote">;
    readonly changed: readonly WorkspacePath[];
    readonly path: WorkspacePath;
    readonly text: string;
    readonly baseText: string;
};

export async function resolveOpenNoteChange(
    input: OpenNoteChangeInput,
): Promise<OpenNoteChange> {
    const { notes, changed, path, text, baseText } = input;
    const key = pathKey(path);
    if (!changed.some((candidate) => pathKey(candidate) === key)) {
        return { kind: "ignore" };
    }
    const opened = await notes.openNote(path);
    if (!opened.ok) {
        return opened.error.code === "not-found"
            ? { kind: "not-found" }
            : { kind: "error", error: opened.error };
    }
    const disk = opened.value;
    if (disk.text === baseText) return { kind: "ignore" };
    if (text !== baseText) return { kind: "conflict" };
    return {
        kind: "reload",
        text: disk.text,
        baseText: disk.text,
        eol: disk.eol,
        bom: disk.bom,
    };
}

export async function batchAffectsNoteList(
    fs: Pick<WorkspaceFileSystem, "stat">,
    paths: readonly WorkspacePath[],
): Promise<boolean> {
    for (const path of paths) {
        if (isMarkdownPath(path)) return true;
        const stat = await fs.stat(path);
        if (!stat.ok || stat.value.kind === "directory") return true;
    }
    return false;
}
