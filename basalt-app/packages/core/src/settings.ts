import type { AppSettings, WorkspaceRoot, WorkspaceSettings } from "./ports";
import { pathKey, toWorkspacePath, type WorkspacePath } from "./workspace-path";

export const APP_SETTINGS_VERSION = 1;

export function defaultAppSettings(): AppSettings {
    return {
        version: APP_SETTINGS_VERSION,
        lastWorkspace: null,
        workspaces: {},
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOpenNotes(raw: unknown): WorkspacePath[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const notes: WorkspacePath[] = [];
    for (const item of raw as unknown[]) {
        if (typeof item !== "string") continue;
        const path = toWorkspacePath(item);
        if (!path.ok) continue;
        const key = pathKey(path.value);
        if (seen.has(key)) continue;
        seen.add(key);
        notes.push(path.value);
    }
    return notes;
}

function parseWorkspace(raw: unknown): WorkspaceSettings | null {
    if (!isRecord(raw)) return null;
    const openNotes = parseOpenNotes(raw.openNotes);
    const active = typeof raw.activeNote === "string" ? raw.activeNote : null;
    const activeNote =
        active === null
            ? null
            : (openNotes.find(
                  (note) => pathKey(note) === pathKey(active as WorkspacePath),
              ) ?? null);
    return { openNotes, activeNote };
}

function parseWorkspaces(raw: unknown): Record<string, WorkspaceSettings> {
    const workspaces: Record<string, WorkspaceSettings> = {};
    if (!isRecord(raw)) return workspaces;
    for (const [root, value] of Object.entries(raw)) {
        if (root === "") continue;
        const workspace = parseWorkspace(value);
        if (workspace !== null) workspaces[root] = workspace;
    }
    return workspaces;
}

export function parseAppSettings(raw: unknown): AppSettings {
    if (!isRecord(raw) || raw.version !== APP_SETTINGS_VERSION) {
        return defaultAppSettings();
    }
    const last = raw.lastWorkspace;
    return {
        version: APP_SETTINGS_VERSION,
        lastWorkspace:
            typeof last === "string" && last !== ""
                ? (last as WorkspaceRoot)
                : null,
        workspaces: parseWorkspaces(raw.workspaces),
    };
}

export function parseAppSettingsText(text: string): AppSettings {
    try {
        return parseAppSettings(JSON.parse(text) as unknown);
    } catch {
        return defaultAppSettings();
    }
}
