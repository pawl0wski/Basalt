import type { AppSettings, AppSettingsStore } from "@basalt/core";

export type SettingsWriter = {
    read(): Promise<AppSettings | null>;
    update(change: (settings: AppSettings) => AppSettings): Promise<void>;
};

export function createSettingsWriter(store: AppSettingsStore): SettingsWriter {
    let cached: AppSettings | null = null;
    let queue: Promise<unknown> = Promise.resolve();

    async function ensureLoaded(): Promise<AppSettings | null> {
        if (cached) return cached;
        const loaded = await store.load();
        if (loaded.ok) cached = loaded.value;
        return cached;
    }

    function enqueue<T>(task: () => Promise<T>): Promise<T> {
        const run = queue.then(task);
        queue = run.catch(() => undefined);
        return run;
    }

    return {
        read: () => enqueue(ensureLoaded),
        update: (change) =>
            enqueue(async () => {
                const current = await ensureLoaded();
                if (!current) return;
                const next = change(current);
                const saved = await store.save(next);
                if (saved.ok) cached = next;
            }),
    };
}
