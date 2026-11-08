import type { SaveMode } from "./notes";
import { err, ok, type AppError, type Result } from "./result";

export type AutosaveStatus = "saved" | "pending" | "saving" | "paused";

export type AutosaveScheduler = (
    run: () => void,
    delayMs: number,
) => () => void;

export type AutosaveOptions = {
    readonly baseText: string;
    readonly save: (text: string, mode: SaveMode) => Promise<Result<void>>;
    readonly schedule: AutosaveScheduler;
    readonly delayMs: number;
};

export type Autosave = {
    change(text: string): void;
    flush(): Promise<Result<void>>;
    resume(): Promise<Result<void>>;
    pause(error: AppError): void;
    forceSave(mode?: SaveMode): Promise<Result<void>>;
    rebase(text: string): void;
    dispose(): void;
    getStatus(): AutosaveStatus;
    getError(): AppError | null;
    onStatus(listener: (status: AutosaveStatus) => void): () => void;
};

export function createAutosave(options: AutosaveOptions): Autosave {
    const { save, schedule, delayMs } = options;
    const listeners = new Set<(status: AutosaveStatus) => void>();
    let baseText = options.baseText;
    let latestText = options.baseText;
    let status: AutosaveStatus = "saved";
    let error: AppError | null = null;
    let cancelTimer: (() => void) | null = null;
    let inflight: Promise<void> | null = null;
    let disposed = false;
    let epoch = 0;

    function setStatus(next: AutosaveStatus): void {
        if (next === status) return;
        status = next;
        for (const listener of [...listeners]) listener(next);
    }

    function clearTimer(): void {
        cancelTimer?.();
        cancelTimer = null;
    }

    function armTimer(): void {
        clearTimer();
        cancelTimer = schedule(() => {
            cancelTimer = null;
            void flush();
        }, delayMs);
    }

    async function saveLatest(mode: SaveMode = "normal"): Promise<void> {
        const text = latestText;
        setStatus("saving");
        const startedAt = epoch;
        const result = await save(text, mode);
        inflight = null;
        if (startedAt !== epoch) return;
        if (!result.ok) {
            error = result.error;
            setStatus("paused");
            return;
        }
        baseText = text;
        if (error) {
            setStatus("paused");
            return;
        }
        setStatus(latestText === baseText ? "saved" : "pending");
    }

    async function flush(): Promise<Result<void>> {
        for (;;) {
            clearTimer();
            while (inflight) await inflight;
            if (error) return err(error);
            if (disposed || latestText === baseText) return ok(undefined);
            inflight = saveLatest();
            await inflight;
        }
    }

    return {
        change(text) {
            if (disposed) return;
            latestText = text;
            if (error || inflight) return;
            if (text === baseText) {
                clearTimer();
                setStatus("saved");
                return;
            }
            setStatus("pending");
            armTimer();
        },
        flush,
        resume() {
            error = null;
            if (status === "paused") {
                setStatus(latestText === baseText ? "saved" : "pending");
            }
            return flush();
        },
        pause(reason) {
            if (disposed) return;
            clearTimer();
            error = reason;
            setStatus("paused");
        },
        async forceSave(mode = "normal") {
            if (disposed) return ok(undefined);
            const wasPaused = error !== null;
            if (!wasPaused && latestText === baseText) return flush();
            error = null;
            clearTimer();
            while (inflight) await inflight;
            if (!disposed && (wasPaused || latestText !== baseText)) {
                error = null;
                inflight = saveLatest(mode);
                await inflight;
            }
            if (error) return err(error);
            return flush();
        },
        rebase(text) {
            if (disposed) return;
            epoch += 1;
            clearTimer();
            baseText = text;
            latestText = text;
            error = null;
            setStatus("saved");
        },
        dispose() {
            disposed = true;
            clearTimer();
            listeners.clear();
        },
        getStatus: () => status,
        getError: () => error,
        onStatus(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
