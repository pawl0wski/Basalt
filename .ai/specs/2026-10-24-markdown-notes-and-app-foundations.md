---
date: 2026-10-24
slug: markdown-notes-and-app-foundations
type: spec
status: draft
tags: [notes, workspace, architecture, primitives, tauri, editor, autosave, watcher, i18n, local-first, e01]
---

# Markdown notes (E01-S01) and the application foundations beneath them

Source issue: #8 (E01-S01, epic #5). Design authority: `.ai/specs/product-brief.md`. Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec").

## 📝 TLDR

The owner needs notes stored as plain `.md` files in a directory they choose (D05). Today the app is a static welcome screen whose buttons do nothing. This spec (future behavior) delivers E01-S01 as a **local-first** desktop app: the local files are the source of truth, and the app is fully usable without any server or account. It also delivers the small set of primitives this story needs and later stories will reuse: platform ports with contract tests, a workspace-scoped file model with a file watcher, autosave, i18n (English only for now), and a custom Obsidian-style editor package. The backend is out of scope (E02). File management (rename, delete, move, folders, folder tree) is a separate story, E01-S04.

## 📝 Decisions from the Open Questions gate

| Id  | Question                 | Answer (owner)                                                                                                                                                                         |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Spec split               | One spec. When issue #8 closes (Phases 1–2), Phase 3 is extracted into its own spec and this one moves to `implemented/` (2026-10-25).                                                  |
| Q2  | Backend in this spec     | None. Everything about the backend moves to E02; this spec is local-only (2026-10-25).                                                                                               |
| Q5  | Editor                   | A custom Markdown editor in the Obsidian style (live preview): our own `@basalt/editor` package on CodeMirror 6, the engine Obsidian uses. We write the Markdown behavior, not a text-layout engine. |
| Q6  | Platforms                | Desktop only for E01-S01; ports keep Android-specific handling out of `core`.                                                                                                          |
| Q7  | Registries               | No `FileKindRegistry` or `CommandRegistry` yet. Plain functions now; a registry is introduced with the second file kind (E01-S03) or the command palette (2026-10-25).                  |
| Q8  | Save model               | Autosave from the start (2026-10-25). Ctrl/Cmd+S remains as "save now".                                                                                                               |
| Q9  | Where app state lives    | Obsidian-style app-level JSON in the app config directory. A `.basalt/` directory inside the workspace is reserved for future workspace-wide (synced) settings and is **not created in E01-S01** (2026-10-25, refined in G2). |
| Q10 | Format and lock-in       | Plain Markdown now. Basalt-specific components embedded in notes will come later and will create some lock-in; keep the editor and file model open to that (2026-10-25).               |
| Q11 | Positioning              | Basalt is local-first (2026-10-25). This refines D05 "offline-first"; the brief should get a clarifying row.                                                                           |

### Decisions from the grilling session (2026-10-25)

| Id  | Topic                         | Decision (owner)                                                                                                                                                                                                       |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Primary scenario              | Workspaces created and used by Basalt. Opening an existing Obsidian vault is not a goal now; no special handling for `.obsidian/` or Obsidian syntax beyond the generic rules.                                       |
| G2  | Per-device state              | `lastOpenedNote` is stored per workspace in `$APPCONFIG/basalt.json`. E01-S01 writes nothing into the workspace except notes, so per-device UI state never syncs (E02) or conflicts between devices.                  |
| G3  | Conflict check                | `saveNote` always re-reads the file before writing; no mtime/size shortcut.                                                                                                                                          |
| G4  | Note list refresh             | A recursive file watcher refreshes the list and detects external changes to the open note. Fallback to re-listing on window focus if the watcher cannot start.                                                       |
| G5  | Out of scope                  | Rename, delete, move, folder creation, notes in sub-folders, folder tree. They form a new story **E01-S04** with its own spec; epic #5 is done only when S01, S03 and S04 are done.                                  |
| G6  | E2E strategy                  | Playwright against the memory platform (as designed below). Real desktop e2e (`tauri-driver`) is revisited when E02 makes real-disk behavior riskier.                                                              |
| G7  | Sidebar                       | Flat list with relative paths in S01; the folder tree arrives in S04.                                                                                                                                                |
| G8  | What a workspace is           | Any directory the owner picks. No marker file, no warnings, one welcome action.                                                                                                                                     |
| G9  | Protection rules kept/dropped | Kept: EOL/BOM preservation, `not-utf8` never written, 5 MiB limit, symlink rejection, conflict detection. Dropped: the 10 000-entry cap.                                                                             |
| G10 | i18n                          | i18n from the start with `i18next` + `react-i18next` and typed keys. English (`en`) is the only language for now; no language detection or switcher yet.                                                            |
| G11 | Delivery                      | Three PRs: Phase 1, Phase 2a, Phase 2b (2b closes #8).                                                                                                                                                               |

### Owner decisions carried to E02 (not designed here)

- Server in .NET; OpenAPI emitted by the server and a TypeScript client generated into `@basalt/api`; EF Core with SQLite (dev) and PostgreSQL (production).
- The server has **its own error codes**; `@basalt/api` maps them to client errors. Client and server never share an error-code list.

### Defaults applied without a gate question (override if wrong)

- The native directory picker can create folders, so the welcome screen has a single "Open folder as workspace" action; the duplicate "Create new workspace" button is removed and `welcome.spec.ts` is updated. A guided "create named workspace" flow is a later feature.
- Notes in sub-folders created outside Basalt are listed recursively as a flat list with the relative path (G7).
- Files larger than 5 MiB are not opened in the editor (message shown). Autosave debounce is 1 000 ms; watcher event debounce is 300 ms. All are constants.

## 📝 Out of scope

- Rename, delete and move of notes; creating folders; creating notes in sub-folders (name validation rejects `/`, so new notes go into the workspace root); folder tree — all E01-S04.
- Search, several open workspaces, opening Obsidian vaults as a goal (G1).
- Languages other than English, language detection and a language switcher (G10).
- Images (E01-S03), sync and anything server-side (E02).

## 📝 Problem Statement

- The owner's note workflow needs plain Markdown files they own, on their disk, readable by any other tool (issue #8, brief Problems).
- Every later story builds on how this one handles paths, file access, errors and saving. If each feature talks to Tauri plugins ad hoc, file management (E01-S04), images (E01-S03), sync (E02) and PDF annotation each re-solve path safety, error handling and testability. We pay for those primitives once, and only for the ones this story uses.

### Design constraints from the backlog

| Constraint       | Source                                       | Consequence here                                                                                           |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Local-first      | D05, owner 2026-10-25                        | Local files are the source of truth; no feature in this spec needs a network, account or server            |
| Plain files      | `BACKWARD_COMPATIBILITY.md` (Workspace on disk) | Nothing except notes is written into the workspace (G2)                                                  |
| Future custom syntax | Owner 2026-10-25                         | The editor stores the exact Markdown source and is built from extensions, so Basalt components can be added later |
| Sync later       | E02                                          | Identity of a note is its `WorkspacePath`; saves are atomic and conflict-checked; per-device state stays out of the workspace |
| File management later | E01-S04 (G5)                            | The ports are extended there (`rename`, `remove`, `mkdir`); nothing in S01 assumes notes live only in the root |

## 📝 Proposed Solution

Build outward from ports. `@basalt/core` defines what the app needs from the world (a workspace-rooted file system with a watcher, a directory picker, app settings) and implements use cases against those ports. Each port has a Tauri adapter (production) and an in-memory adapter (unit tests and Playwright), and a shared contract test suite that both must pass.

Alternatives considered:

- **Call `@tauri-apps/plugin-fs` directly from components/stores.** Fastest now; makes e2e impossible (Playwright runs the Vite app in plain Chromium, no Tauri runtime) and spreads path validation. Rejected.
- **A custom Rust command for file access.** Forbidden by AGENTS.md unless plugins cannot do the job; they can.
- **A hidden index database for notes.** Violates "no database" in the workspace model; an in-memory index can be added later behind the same use cases.
- **Textarea editor.** Cheapest, but the owner chose an Obsidian-style editor (Q5).
- **Registries for file kinds and commands now.** One file kind and three commands do not justify them (Q7).
- **Re-list only on focus instead of a watcher.** Simpler, but the owner wants live refresh (G4); kept only as the fallback.
- **Mock Tauri IPC in Playwright, or `tauri-driver` e2e.** IPC mocks are fragile against plugin changes; `tauri-driver` is slow and a second runner. Rejected for now (G6).

## 📝 Architecture

```text
basalt-app/
├── src-tauri/            existing — gains plugin registration only (fs with the `watch` feature, dialog, persisted-scope)
└── packages/
    ├── core/             existing — ports, WorkspacePath, AppError/Result, note use cases, autosave, watcher handling (+ ./testing entry)
    ├── editor/           NEW (Phase 2a) — framework-agnostic Markdown editor on CodeMirror 6
    ├── ui/               existing — gains shadcn Dialog, Input, Alert, ScrollArea
    ├── api/              existing — unchanged in this spec
    └── app/              existing — composition root, Tauri/memory platforms, i18n, features/, stores
```

Dependency direction (extends the standards spec; `editor` is a new leaf):

```text
app ──► core, ui, editor
editor ──► CodeMirror/Lezer only (no React, no Tauri, no @basalt/*)
core, ui, api ──► unchanged rules
```

**Why a new package for the editor.** CodeMirror is the largest, most volatile dependency of the app. A separate package keeps `core` free of browser globals and `ui` free of document logic, and gives the future Basalt components (Q10) one place to live. The React wrapper (`NoteEditor`) lives in `app`.

### Frontend primitives (all in `@basalt/core`)

1. **`AppError` and `Result<T>`**: discriminated union with a stable client-side `code` (`not-found`, `permission-denied`, `already-exists`, `invalid-path`, `conflict`, `too-large`, `not-utf8`, `unavailable`, `unknown`) and a safe `message` for logs only (never shown to the user, see i18n). Adapters map platform errors into it; UI maps `code` to a translation key. Never carries note content. Server errors (E02) get their own codes, mapped in `@basalt/api`.
2. **`WorkspacePath`**: branded string, a `/`-separated path relative to the workspace root. Produced only by `toWorkspacePath(input)`, which rejects absolute paths, drive letters, `..` and empty segments, `\`, NUL and control characters. Names are kept exactly as the file system returns them (no Unicode normalization), so any listed file can be opened. Comparison for collisions uses `pathKey(path)` = NFC + case fold. Adapters convert native separators to `/`; a file whose name contains `\` on Linux/macOS cannot be represented and is skipped by listing. This is the single place path safety lives; the fs scope is the second layer.
3. **Ports** (explicit injection, no service locator):
   - `WorkspaceAccess.open(root): Promise<Result<WorkspaceFileSystem>>`: verifies the root is reachable and authorized and returns a file system bound to it. `WorkspaceRoot` is an absolute, platform-native directory path, produced only by the picker or by restoring settings.
   - `WorkspaceFileSystem`: `list`, `stat`, `readText`, `writeTextAtomic`, `createExclusive`, `watch`. Methods take `WorkspacePath`, never absolute paths. E01-S04 adds `rename`, `remove`, `mkdir`; they are not added before they are used.
   - `WorkspacePicker.pickDirectory(): Promise<Result<WorkspaceRoot | null>>`.
   - `AppSettingsStore`: `load()`, `save(settings)` for the app-level JSON (Data Model).
   No `Clock`, `IdGenerator` or `Logger` ports yet (YAGNI); autosave and watcher timing are injected as a scheduler function.
4. **File kinds**: `isMarkdownPath(path)` (case-insensitive `.md`). Replaced by a registry when E01-S03 adds images (Q7).
5. **Note use cases** (`createNotes({ fs })` returns `listNotes`, `openNote`, `createNote`, `saveNote`, `suggestNoteName`): all domain rules live here, not in React or in adapters: which entries are notes (Markdown only, skipping dot-entries and temp files), naming and collisions, size limit, EOL/BOM handling, conflict detection and the atomic write sequence.
6. **Autosave** (`createAutosave({ save, schedule, delayMs })`): a small state machine, independent of React. Rules:
   - Writes only when the note is dirty; opening or viewing a note never writes.
   - Debounced `delayMs` after the last change; flushed immediately on Ctrl/Cmd+S, note switch, workspace change and window close.
   - At most one save in flight; changes made during a save schedule one follow-up save with the latest text.
   - On any error (including `conflict` and `not-found`) autosave pauses for that note until the owner resolves the banner; the text is never discarded.
   - Status for the UI: `saved | pending | saving | paused`.
7. **Workspace watching** (`createWorkspaceWatcher({ fs, schedule, debounceMs })`): subscribes to `fs.watch`, batches events for `debounceMs` (300 ms), and emits a deduplicated set of changed `WorkspacePath`s plus a `rootLost` signal. Consumers:
   - The note list re-lists when any batch contains a Markdown path (or a directory change).
   - The open note: on a change to its path, the file is re-read and normalized. If the normalized disk text equals `baseText`, the event is ignored (this is how the app's own writes are recognised — by content, never by timing). Otherwise, if the session is **clean**, the editor silently reloads the disk text (`setText`, no `onChange` echo) and `baseText` is updated; if it is **dirty**, the conflict banner is shown immediately and autosave pauses. If the file is gone, the `not-found` flow runs.
   - `rootLost` (the workspace directory was deleted or renamed) runs the `unavailable` flow.
   - If `watch` fails to start (for example the Linux inotify watch limit), the app falls back to re-listing on window focus and shows an unobtrusive notice; everything else keeps working.

### Platform adapters (`@basalt/app/src/platform/`)

- `tauri/`: `TauriWorkspaceAccess` / `TauriWorkspaceFileSystem` (`@tauri-apps/plugin-fs`), `TauriWorkspacePicker` (`@tauri-apps/plugin-dialog`, which extends the fs scope at runtime for the chosen directory), `TauriAppSettingsStore` (plugin-fs on `$APPCONFIG/basalt.json`).
  - `readText` uses `readFile` and `new TextDecoder("utf-8", { fatal: true })`; `readTextFile` must not be used because it decodes lossily and could never report `not-utf8`.
  - `watch` uses plugin-fs `watch` (debounced variant, `recursive: true`) on the workspace root and maps absolute event paths to `WorkspacePath` (events outside the root or not representable are dropped).
- `memory/`: thin wiring around `@basalt/core/testing`'s in-memory file system. It persists its state to `localStorage` so it survives a page reload, and exposes a `window.__basaltTestFs` test handle that Playwright uses to assert the exact bytes of saved files and to simulate external changes (`externalWrite(path, bytes)`, `externalDelete(path)`, `removeRoot()`), which fire watch events. Selected only when `VITE_BASALT_PLATFORM=memory` (Playwright's `webServer` sets it) through a dynamic import; a build check asserts the production bundle does not contain it.
- `createPlatform()` is the single selection point in the composition root.

### State and UI (`@basalt/app`)

- `features/workspace/` (store: `root`, `status`, `error`, `watchMode: "live" | "focus-fallback"`; actions `openWorkspace`, `restoreWorkspace`) and `features/notes/` (store: `notes[]`, `session { path, text, baseText, eol, bom, error, saveStatus }`). `isDirty = text !== baseText` is derived, not stored.
- Actions are plain functions taking the ports (created in the composition root and passed into stores), so containers stay thin and tests inject fakes.
- Presentational components (typed props, no store access, no i18n access — texts come in through props): `WelcomeScreen`, `WorkspaceLayout`, `NoteList`, `NoteEditor` (wraps `@basalt/editor`), `NewNoteDialog`, `UnsavedChangesDialog`, `ErrorBanner`, `SaveStatus`. Containers connect them and translate.
- Shortcuts (`Ctrl/Cmd+S`, `Ctrl/Cmd+N`, `Ctrl/Cmd+O`) are bound in one keymap module in `app`.

### i18n (`@basalt/app/src/i18n/`)

- `i18next` + `react-i18next`, initialised in the composition root with `lng: "en"`, `fallbackLng: "en"` and resources bundled statically (no HTTP backend).
- One resource file, `locales/en.json`, namespaced by feature (`welcome`, `workspace`, `notes`, `errors`, `saveStatus`). Keys are typed through the `i18next` `CustomTypeOptions` declaration so a missing or misspelled key fails `typecheck`.
- `errors.<AppErrorCode>` is the single mapping from `AppError.code` to user text; a unit test asserts every code has an entry.
- `core` never returns user text. `ui` has no i18n dependency. The default note name is a translation (`notes.untitled` = "Untitled") passed into `suggestNoteName`.
- Adding a language later means adding a locale file and a detection/switch mechanism (a `language` field in `basalt.json`); nothing in this spec has to change for that.

### Editor package (`@basalt/editor`)

`createMarkdownEditor(parent, { doc, onChange, extensions? })` returns `{ getText, setText, focus, destroy }`. Phase 2a ships source mode: Markdown language, history, line wrapping, a Basalt theme driven by CSS variables, all assembled from CodeMirror extensions through the `extensions` option. Phase 3 adds live preview as further extensions. The document is always the exact Markdown source (LF line endings in memory); no editor-only metadata is ever written to the note. Future Basalt components (Q10) are added as extensions over a Markdown-compatible syntax, so the notes stay readable in other editors.

## 📝 Data Model

- **Workspace on disk:** a note is a `.md` file; its identity is its relative path; its title is the file name without extension. Nothing is injected into notes (no front matter, no sidecars) and nothing else is written into the workspace (G2). Temporary files `.<name>.basalt-tmp` exist only during a save and are never listed.
- **`.basalt/` in the workspace:** reserved for future workspace-wide settings that should sync with the workspace (like Obsidian's `.obsidian/`). Not created, read or required in E01-S01; dot-entries are skipped by listing, so an existing `.basalt/` is ignored.
- **App-level settings:** `$APPCONFIG/basalt.json`, like Obsidian's `obsidian.json`:

  ```json
  {
      "version": 1,
      "lastWorkspace": "<WorkspaceRoot> | null",
      "workspaces": { "<WorkspaceRoot>": { "lastOpenedNote": "<WorkspacePath> | null" } }
  }
  ```

  The last workspace cannot live inside the workspace, because the app must know it before it can open the workspace; `lastOpenedNote` is per-device state and must not sync (G2). Validated at runtime: invalid content means "no last workspace"; an invalid entry under `workspaces` is dropped; an invalid `lastOpenedNote` (not a valid `WorkspacePath` or no longer present) simply means no note is reopened. A failed write is logged (without paths or content) and does not affect the workspace.
- **In memory:** `Note { path: WorkspacePath, name }`, `NoteSession` (above).

### Line endings and BOM

1. On open, the file is decoded as UTF-8 (invalid → `not-utf8`, never written). A leading BOM is removed and remembered (`bom: boolean`). The dominant line ending (`lf` | `crlf`) is detected and remembered (`eol`). The text is converted to LF; this is both the editor text and `baseText`.
2. On save, LF is converted to `eol` and the BOM is restored if it was present. A uniform file therefore round-trips byte for byte.
3. A file with mixed line endings is written with its dominant ending. This only happens after the owner actually edits it, because unedited notes are never written (autosave rule 1). Documented limitation.
4. The conflict check compares the **normalized** disk text (LF, no BOM) with `baseText`. A change of only line endings or BOM on disk is not a conflict; the save then uses the style found on disk. The same comparison decides whether a watcher event for the open note is ignored.

## 📝 API Contracts

```ts
interface WorkspaceAccess {
    open(root: WorkspaceRoot): Promise<Result<WorkspaceFileSystem>>; // unavailable, permission-denied
}

interface WorkspaceFileSystem {
    list(): Promise<Result<readonly FileEntry[]>>; // recursive raw listing, does not follow symlinks
    stat(path: WorkspacePath): Promise<Result<FileStat>>; // { kind: "file" | "directory" | "symlink", size, mtimeMs }, no symlink follow
    readText(path: WorkspacePath): Promise<Result<string>>; // not-found, not-utf8
    writeTextAtomic(path: WorkspacePath, text: string): Promise<Result<void>>; // temp file + rename
    createExclusive(path: WorkspacePath, text: string): Promise<Result<void>>; // already-exists if present
    watch(onEvent: (event: WatchEvent) => void): Promise<Result<Unwatch>>; // recursive; unavailable if it cannot start
}

type WatchEvent = { kind: "changed"; paths: readonly WorkspacePath[] } | { kind: "root-lost" };
type Unwatch = () => Promise<void>;

interface WorkspacePicker {
    pickDirectory(): Promise<Result<WorkspaceRoot | null>>; // null = user cancelled
}

interface AppSettingsStore {
    load(): Promise<Result<AppSettings>>;
    save(settings: AppSettings): Promise<Result<void>>;
}

interface NoteService {
    listNotes(): Promise<Result<readonly Note[]>>;
    openNote(path: WorkspacePath): Promise<Result<OpenedNote>>; // { text, eol, bom }; too-large via stat before reading; symlink → invalid-path
    suggestNoteName(existing: readonly Note[], baseName: string): string; // first free of baseName, "baseName 1", ...
    createNote(name: string): Promise<Result<Note>>; // already-exists, invalid-path; workspace root only; never auto-suffixes
    saveNote(input: {
        path: WorkspacePath;
        text: string;
        baseText: string;
        eol: Eol;
        bom: boolean;
        mode?: "normal" | "overwrite" | "recreate";
    }): Promise<Result<{ baseText: string }>>;
}
```

`saveNote` sequence (G3): `stat` the file; if it is missing → `not-found` unless `mode: "recreate"`; if it is a symlink → `invalid-path`; otherwise always re-read and, if the normalized text differs from `baseText`, return `conflict` unless `mode: "overwrite"`; then `writeTextAtomic`. The remaining stat-to-rename window is accepted.

Tauri changes:

- `Cargo.toml`: `tauri-plugin-fs` with the `watch` feature, `tauri-plugin-dialog`, `tauri-plugin-persisted-scope`; `lib.rs` gains only the plugin registration lines.
- `capabilities/default.json` gains least-privilege entries only: `dialog:allow-open`, `fs:allow-read-dir`, `fs:allow-read-file`, `fs:allow-write-file`, `fs:allow-rename`, `fs:allow-remove` (temp cleanup), `fs:allow-stat`, `fs:allow-lstat`, `fs:allow-watch`, `fs:allow-unwatch`, `fs:allow-mkdir` (only for creating `$APPCONFIG`); fs scope `$APPCONFIG/basalt.json` at build time, plus the picked directory at runtime only. No `$HOME/**`. Window permissions needed by the close guard (expected: `core:window:allow-destroy`) are confirmed in the Phase 2a spike.

## 📝 UI/UX

All user-facing text comes from `locales/en.json`.

- **No workspace:** welcome screen with one "Open folder as workspace" action (native picker, which can also create a folder). Cancel leaves the screen unchanged.
- **Workspace open:** left sidebar lists notes as a flat list (relative path, sorted case-insensitively), "New note" button, workspace name with a "Change workspace" action. The last opened note of that workspace is reopened. Empty workspace shows "Create your first note". The list updates live when files change on disk (G4); in focus-fallback mode a small notice says the list refreshes when the window is focused.
- **New note:** dialog with a name field prefilled with `suggestNoteName` (`Untitled`, or `Untitled 1` if taken, ...). The note is created in the workspace root. If the owner types a name that is invalid or already exists, an inline message is shown and the Create button is disabled. No hidden renaming.
- **Editing and saving:** autosave; a `SaveStatus` indicator shows "Saved" / "Saving…" / "Not saved". Ctrl/Cmd+S saves immediately.
- **External changes to the open note:** clean → reloaded silently; dirty → conflict banner at once; deleted → deleted-file banner.
- **Leaving a note** (switch note, change workspace, close window): pending changes are flushed. Only if that save fails does the Save-failed dialog appear, with Retry / Discard changes / Cancel.
- **Errors:** a persistent `role="alert"` banner above the editor with the reason and actions; autosave stays paused until it is resolved. The editor text is never cleared by an error.
- **Accessibility:** the note list is a labelled `listbox` (`aria-selected`, arrow-key navigation); dialogs trap focus (Radix); the banner is announced to screen readers.
- Prototype: none.

## 📝 Edge Cases & Failure Scenarios

| Scenario                                                          | Behavior                                                                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directory not writable (AC3)                                      | Save returns `permission-denied`; banner with Retry; autosave paused; editor text and dirty state kept; the original file is unmodified (failure before rename). |
| Create note in a read-only workspace                              | `createExclusive` fails; inline error; no ghost entry in the list.                                                                                          |
| `basalt.json` not writable                                        | Workspace still works; remembering the last workspace/note silently fails (logged without paths or content).                                               |
| Crash/failure between temp write and rename                       | Original intact; the stray `.basalt-tmp` is ignored by listing and removed on the next successful save of that note.                                       |
| File changed on disk by another program, open note is clean       | Watcher event → re-read → editor reloads the disk text; no banner.                                                                                         |
| File changed on disk by another program, open note is dirty       | Watcher event → `conflict` banner immediately; autosave paused; banner offers "Keep my version" (`overwrite`) or "Load version from disk" (discards local edits after confirmation). The same banner results from a save if the watcher missed the event. |
| Own save triggers a watcher event                                 | Normalized disk text equals `baseText` → ignored.                                                                                                           |
| File deleted or moved externally while open                       | `not-found`; autosave paused (it must not silently resurrect a file the owner deleted elsewhere); banner offers "Save again here" (`recreate`) or "Close note" (after confirmation if dirty). |
| Note added/removed externally                                     | List updates within the watcher debounce (or on next focus in fallback mode).                                                                               |
| Watcher cannot start (e.g. inotify limit)                         | Focus-fallback mode with a notice; saving and conflict detection on save still work.                                                                        |
| Workspace folder deleted/renamed while open, no unsaved changes   | `root-lost`/`unavailable`; app returns to the welcome screen with an explanatory notice; `lastWorkspace` is kept.                                          |
| Workspace folder deleted/renamed while open, unsaved changes      | The editor stays open with the text; banner explains and offers Retry or "Change workspace" (the Save-failed dialog runs first).                            |
| Last workspace no longer exists or scope was lost on launch       | Welcome screen with a notice; no crash.                                                                                                                     |
| Non-UTF-8 file                                                    | Listed; opening shows `not-utf8`; never written.                                                                                                            |
| File larger than 5 MiB                                            | Listed; opening shows `too-large` (decided by `stat`, without reading the file).                                                                           |
| CRLF, BOM, mixed line endings                                     | See "Line endings and BOM".                                                                                                                                 |
| Name issues (`..`, `/`, `\`, `:*?"<>\|`, Windows reserved names, trailing dot/space, > 255 bytes, case-only or Unicode-form-only collisions) | Rejected by `validateNoteName` with an inline message; collisions compared with `pathKey`.                     |
| Symlinks                                                          | Not followed in listing; opening or saving a symlink path is rejected as `invalid-path` (detected with `stat`).                                            |
| User cancels the picker                                           | No state change, no error.                                                                                                                                  |
| Typing during a save                                              | One follow-up save with the latest text; no lost keystrokes, no overlapping writes.                                                                         |

## 📝 Risks & Impact Review

- **Hard to reverse:** `WorkspacePath` and the on-disk shape become the foundation for sync and E2EE. Mitigated by writing nothing but notes into the workspace and keeping `basalt.json` versioned. Widening the Tauri fs scope later is a protected-surface change.
- **Future lock-in (Q10):** custom Basalt components will make some notes depend on Basalt. Not built here; the extension-based editor and the "exact source" rule keep that decision open. It needs its own spec with a graceful-degradation rule.
- **Standards drift.** Adding `@basalt/editor` and i18n extends the "current" standards spec and README package list; Phase 2a updates both in the same PR.
- **Watcher behavior differs per OS.** Event shapes (create/modify/rename, rename-over for atomic writes) differ between inotify and ReadDirectoryChangesW. Mitigated by treating every event as "something under these paths changed" and deciding by re-reading content, never by event kind.
- **Unverified platform assumptions** (Phase 2a spike, step 1): the dialog plugin extends the fs scope at runtime for a picked directory; `tauri-plugin-persisted-scope` keeps it across restarts; plugin-fs refuses symlink escapes; `stat` reports symlinks without following; rename within scope replaces atomically on Windows and Linux; recursive `watch` works on a runtime-scoped directory and reports the root's deletion; the close-guard window permissions. If any is false, the fallback is the one in the standards spec (a narrowly scoped custom command), which needs its own spec.
- **Autosave writes often.** Each save is a `stat`, a re-read and an atomic write. Acceptable for ≤ 5 MiB notes with a 1 s debounce.
- **Editor scope creep.** "Like Obsidian" is open-ended. Phase 3 is bounded to its element list; anything else needs a new story.
- **What tests can and cannot prove.** Playwright runs against the memory platform, so it proves app behavior, not real disk or real watcher behavior. The Tauri adapters get unit tests for error mapping, path conversion and watch-event mapping with mocked IPC, which do not prove plugin behavior. Real file-system behavior is covered by the spike results (recorded as a lesson) and a manual smoke test on a built desktop app (Linux and Windows) documented in the Phase 2b PR.
- **Market check (general knowledge, not freshly verified).** Obsidian: vault is a folder, live preview on CodeMirror 6, `.obsidian/` per vault and `obsidian.json` in the app config; its per-device `workspace.json` inside the vault is a known sync-conflict source, which G2 avoids. Logseq: a derived database needed re-indexing and caused drift — we keep no index on disk.

## 📝 Decisions in play

- **D05** (MVP includes Markdown notes, offline-first) — this spec implements Markdown notes; the owner clarified offline-first as local-first (Q11).
- **D02** (built for the owner first) — justifies defaults such as one remembered workspace, English only, and no polish beyond the acceptance criteria.
- **N02** (no Cloud work now) — respected; no server work at all in this spec.
- **N03** (no tags, backlinks, graph, themes) — respected; the editor package is not a backdoor for them.
- **N01** (no iOS/web in the MVP) — respected; the memory platform is a test harness, excluded from production bundles.
- Nothing proposed supersedes an active entry. Epic #5 gains story E01-S04 (G5).

## 📋 Phasing

1. **Phase 1 — Core primitives (PR 1).** Errors, paths, ports, note use cases, autosave, watcher handling, in-memory FS and contract suite, settings parser. No visible change; the app keeps working.
2. **Phase 2a — Platform and building blocks (PR 2).** Tauri plugins and capability, adapters (including watch), memory platform, `@basalt/editor` (source mode), i18n setup, `@basalt/ui` primitives. No visible change beyond what the welcome screen already shows.
3. **Phase 2b — E01-S01 on desktop (PR 3).** Stores, workspace UI, autosave and watcher wiring, e2e, docs. Closes issue #8.
4. **Phase 3 — Live-preview editor.** Extracted into its own spec and issue when issue #8 closes (Q1); listed here so the editor API is designed for it.

Phases are sequential.

## 📋 Implementation Plan

Each step is testable and leaves the app working. Vitest next to code, Playwright in `basalt-app/e2e/`.

### Phase 1 — Core primitives (PR 1)

1. `AppError`, `Result`, helpers (`ok`, `err`, `mapError`). Tests: exhaustive code handling.
2. `toWorkspacePath`, `pathKey`, `validateNoteName`. Tests: traversal (`../x`, `a/../../b`), absolute and drive paths, `\`, NUL, NFD names kept as-is but colliding with NFC under `pathKey`, Windows reserved names, trailing dot/space, length, case-only collisions.
3. Port interfaces plus `@basalt/core/testing` with `createInMemoryWorkspaceFileSystem` (read-only mode, `failNextWrite`, symlink entries, serializable state, watch events, `externalWrite`/`externalDelete`/`removeRoot`, `failWatch`) and `describeWorkspaceFileSystemContract(factory)`. Tests: the in-memory FS passes the contract (atomic write leaves the original on failure, `createExclusive` refuses overwrite, `stat` reports symlinks without following, writes and external changes emit watch events, root removal emits `root-lost`).
4. Note use cases and `isMarkdownPath`. Tests: listing filters (non-Markdown, dot-entries, temp files), `suggestNoteName` with a given base name, `createNote` collisions and root-only names, `too-large` without reading, `not-utf8`, symlink rejection, EOL/BOM round trip byte for byte, mixed-EOL rule, EOL-only disk change is not a conflict, save always re-reads (a same-size, same-mtime external change is still a conflict), `conflict`/`overwrite`, `not-found`/`recreate`, and the AC3 scenario (write fails → error returned, original untouched).
5. Autosave state machine with an injected scheduler. Tests: no write when clean, debounce, flush, single in-flight save with one follow-up, pause on error and resume after resolution.
6. Workspace watcher with an injected scheduler. Tests: debounce and deduplication, Markdown/non-Markdown filtering for list refresh, own write ignored by content, clean session reloads, dirty session yields conflict, deletion yields `not-found`, `root-lost` propagated, start failure reports fallback.
7. Settings schema and parser for `basalt.json` (including `workspaces[root].lastOpenedNote`). Tests: valid, missing, malformed, invalid entries dropped and future-version input.

### Phase 2a — Platform and building blocks (PR 2)

1. Spike and register `tauri-plugin-fs` (`watch` feature), `-dialog`, `-persisted-scope` (only `lib.rs` plugin lines, `Cargo.toml`, `capabilities/default.json`, npm packages). Verify the Risks assumptions on Linux and Windows; record results in a lesson. `rust:fmt`/`rust:lint` stay green.
2. Tauri adapters (`WorkspaceAccess`, `WorkspaceFileSystem` including `watch`, `WorkspacePicker`, `AppSettingsStore`). Unit tests with `@tauri-apps/api/mocks`: plugin-error → `AppError` mapping, path conversion, invalid UTF-8 → `not-utf8`, watch-event path mapping and dropping of out-of-root paths. The adapter also passes the contract suite where IPC mocks allow it.
3. Memory platform (persistence across reload, `__basaltTestFs` handle with external-change simulation), `createPlatform()`, Playwright `webServer` env, production-bundle check.
4. `@basalt/editor` package (workspace entry, `tsconfig`, eslint/vitest wiring) with source mode. Tests: `onChange` fires on edits, `setText` does not echo `onChange`, `extensions` compose, `destroy` detaches.
5. i18n: `i18next` + `react-i18next`, `locales/en.json`, typed keys, `errors.*` mapping. Tests: every `AppError` code has a translation; the welcome screen renders its texts through i18n; a missing key fails typecheck (verified once, documented in the lesson).
6. `@basalt/ui`: add shadcn `Dialog`, `Input`, `Alert`, `ScrollArea` with rendering/accessibility tests.
7. Docs: standards spec and README package list (`@basalt/editor`, i18n rule).

### Phase 2b — E01-S01 on desktop (PR 3)

1. Workspace and note stores/actions; `restoreWorkspace` (last workspace, its last note) on launch. Tests with fake ports: open, cancel, restore failure, error mapping, dirty derivation, failure keeps text, `lastOpenedNote` saved per workspace.
2. Presentational components and containers; single welcome action; keymap; autosave wiring with `SaveStatus`; watcher wiring (live list, clean reload, dirty conflict, fallback notice); flush on leave and Save-failed dialog; Tauri window close guard; conflict and deleted-file banners.
3. Playwright specs (memory platform): open a workspace and see Markdown files listed; create a note, type, wait for "Saved", reload and see the content, and assert the bytes through `__basaltTestFs`; read-only workspace shows the error and keeps the text (AC3); external edit of a clean open note reloads it; external edit of a dirty note shows the conflict banner; external add shows the new note in the list; deleted-file banner; save-failed dialog; last workspace and note restored; update `welcome.spec.ts`.
4. Docs: README workspace section (local-first, nothing but notes written into the workspace), `.ai/lessons`, run log, manual smoke test results. Extract Phase 3 into its own spec and move this one to `implemented/` (Q1).

### Phase 3 — Live-preview editor (to be extracted)

1. Theme tokens for preview styles. Test: default config unchanged.
2. Marker-hiding decorations for headings, emphasis, strong, inline code; source shown on the active line/selection. Tests on decoration sets for given states.
3. Links, lists, task lists, blockquotes, fenced code styling. Tests as above.
4. Playwright: typing Markdown renders the styled result; cursor entry reveals source; saved file text is the exact source.

### Acceptance criteria traceability (issue #8)

| Criterion                                                       | Verified by                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Choose a directory → app opens it and lists its Markdown files  | Phase 1 step 4 listing tests; Phase 2b step 1 store tests; step 3 e2e                            |
| Create, edit, save → `.md` file with that content exists        | Phase 1 steps 4–5; Phase 2b step 3 e2e (bytes asserted in the memory FS); manual smoke on a built desktop app |
| Not writable → error shown, unsaved text kept (proposed)        | Phase 1 step 4; Phase 2b step 1 store test; step 3 e2e                                           |
