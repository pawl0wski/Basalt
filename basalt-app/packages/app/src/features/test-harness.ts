import {
    defaultAppSettings,
    err,
    ok,
    toWorkspacePath,
    type AppErrorCode,
    type AppSettings,
    type AppSettingsStore,
    type Result,
    type WorkspacePicker,
    type WorkspacePath,
    type WorkspaceRoot,
} from "@basalt/core";
import {
    createInMemoryWorkspaceFileSystem,
    createInMemoryWorkspaceTrash,
    type InMemoryWorkspaceFileSystem,
    type InMemoryWorkspaceFileSystemOptions,
} from "@basalt/core/testing";
import type { Platform, WindowChrome } from "../platform/platform";
import { createServices, type Services } from "../services";

export function wsPath(value: string): WorkspacePath {
    const result = toWorkspacePath(value);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
}

export function root(value: string): WorkspaceRoot {
    return value as WorkspaceRoot;
}

export function seedFs(
    files: Readonly<Record<string, string | Uint8Array>>,
    options: InMemoryWorkspaceFileSystemOptions = {},
): InMemoryWorkspaceFileSystem {
    const seeded = createInMemoryWorkspaceFileSystem();
    for (const [name, content] of Object.entries(files)) {
        seeded.externalWrite(
            wsPath(name),
            typeof content === "string"
                ? new TextEncoder().encode(content)
                : content,
        );
    }
    return createInMemoryWorkspaceFileSystem({
        ...options,
        state: seeded.getState(),
    });
}

export function createFakeScheduler() {
    let nextId = 0;
    const timers = new Map<number, () => void>();
    const delays: number[] = [];
    return {
        delays,
        schedule(run: () => void, delayMs: number) {
            delays.push(delayMs);
            const id = nextId++;
            timers.set(id, run);
            return () => {
                timers.delete(id);
            };
        },
        fire() {
            const due = [...timers.values()];
            timers.clear();
            for (const run of due) run();
        },
        pending: () => timers.size,
    };
}

export async function settle(): Promise<void> {
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export function createHarness(
    options: {
        workspaces?: Record<string, InMemoryWorkspaceFileSystem>;
        settings?: AppSettings;
        picked?: WorkspaceRoot | null;
        pickError?: boolean;
        failSettingsSave?: boolean;
        accessError?: AppErrorCode;
    } = {},
) {
    const workspaces = options.workspaces ?? {};
    let persisted = options.settings ?? defaultAppSettings();
    const state = { picked: options.picked ?? null };
    const saves: AppSettings[] = [];
    const pickCalls: Parameters<WorkspacePicker["pickDirectory"]>[0][] = [];
    const settingsStore: AppSettingsStore = {
        load: () => Promise.resolve(ok(persisted)),
        save(next): Promise<Result<void>> {
            if (options.failSettingsSave) {
                return Promise.resolve(
                    err({ code: "unknown", message: "disk full" }),
                );
            }
            persisted = next;
            saves.push(next);
            return Promise.resolve(ok(undefined));
        },
    };
    const closeHandlers = new Set<() => Promise<boolean>>();
    const windowState = { destroyed: 0 };
    const trashState = { readOnly: false };
    const windowChrome: WindowChrome = {
        minimize() {},
        toggleMaximize() {},
        close() {
            for (const handler of [...closeHandlers]) void handler();
        },
        destroy() {
            windowState.destroyed += 1;
        },
        onCloseRequested(handler) {
            closeHandlers.add(handler);
            return () => {
                closeHandlers.delete(handler);
            };
        },
        subscribeMaximized: () => () => {},
    };
    const platform: Platform = {
        access: {
            open(target) {
                const fs = workspaces[target];
                return Promise.resolve(
                    fs
                        ? ok(fs)
                        : err({
                              code: options.accessError ?? "not-found",
                              message: "missing",
                          }),
                );
            },
        },
        picker: {
            pickDirectory(pickOptions) {
                pickCalls.push(pickOptions);
                return Promise.resolve(
                    options.pickError
                        ? err({ code: "unknown", message: "picker failed" })
                        : ok(state.picked),
                );
            },
        },
        settings: settingsStore,
        trash: (target) =>
            createInMemoryWorkspaceTrash(
                (path) => workspaces[target]?.externalDelete(path),
                { readOnly: () => trashState.readOnly },
            ),
        windowChrome,
    };
    const scheduler = createFakeScheduler();
    const watchScheduler = createFakeScheduler();
    const services: Services = createServices(platform, {
        untitledName: () => "Untitled",
        schedule: scheduler.schedule,
        watchSchedule: watchScheduler.schedule,
    });
    return {
        ...services,
        scheduler,
        watchScheduler,
        saves,
        pickCalls,
        windowState,
        requestWindowClose: async () => {
            const results = await Promise.all(
                [...closeHandlers].map((handler) => handler()),
            );
            return results.every(Boolean);
        },
        persisted: () => persisted,
        pick(value: WorkspaceRoot | null) {
            state.picked = value;
        },
        setTrashReadOnly(value: boolean) {
            trashState.readOnly = value;
        },
    };
}
