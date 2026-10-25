---
date: 2026-10-24
slug: markdown-notes-and-app-foundations
type: spec
status: draft
tags: [notes, workspace, architecture, primitives, tauri, editor, autosave, local-first, e01]
---

# Markdown notes (E01-S01) and the application foundations beneath them

Source issue: #8 (E01-S01, epic #5). Design authority: `.ai/specs/product-brief.md`. Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec").

## 📝 TLDR

The owner needs notes stored as plain `.md` files in a directory they choose (D05). Today the app is a static welcome screen whose buttons do nothing. This spec (future behavior) delivers E01-S01 as a **local-first** desktop app: the local files are the source of truth, and the app is fully usable without any server or account. It also delivers the small set of primitives this story needs and later stories will reuse: platform ports with contract tests, a workspace-scoped file model, autosave, and a custom Obsidian-style editor package. The backend is out of scope (E02).

## 📝 Decisions from the Open Questions gate

| Id  | Question                 | Answer (owner)                                                                                                                                                                         |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Spec split               | One spec. When issue #8 closes (Phases 1–2), Phase 3 is extracted into its own spec and this one moves to `implemented/` (2026-10-25).                                                  |
| Q2  | Backend in this spec     | None. Everything about the backend moves to E02; this spec is local-only (2026-10-25).                                                                                               |
| Q5  | Editor                   | A custom Markdown editor in the Obsidian style (live preview): our own `@basalt/editor` package on CodeMirror 6, the engine Obsidian uses. We write the Markdown behavior, not a text-layout engine. |
| Q6  | Platforms                | Desktop only for E01-S01; ports keep Android-specific handling out of `core`.                                                                                                          |
| Q7  | Registries               | No `FileKindRegistry` or `CommandRegistry` yet. Plain functions now; a registry is introduced with the second file kind (E01-S03) or the command palette (2026-10-25).                  |
| Q8  | Save model               | Autosave from the start (2026-10-25). Ctrl/Cmd+S remains as "save now".                                                                                                               |
| Q9  | Where app state lives    | Obsidian-style: an app-level JSON in the app config directory, and an optional `.basalt/` directory inside the workspace for workspace state (2026-10-25).                             |
| Q10 | Format and lock-in       | Plain Markdown now. Basalt-specific components embedded in notes will come later and will create some lock-in; keep the editor and file model open to that (2026-10-25).               |
| Q11 | Positioning              | Basalt is local-first (2026-10-25). This refines D05 "offline-first"; the brief should get a clarifying row.                                                                           |

### Owner decisions carried to E02 (not designed here)

- Server in .NET; OpenAPI emitted by the server and a TypeScript client generated into `@basalt/api`; EF Core with SQLite (dev) and PostgreSQL (production).
- The server has **its own error codes**; `@basalt/api` maps them to client errors. Client and server never share an error-code list.

### Defaults applied without a gate question (override if wrong)

- The native directory picker can create folders, so the welcome screen has a single "Open folder as workspace" action; the duplicate "Create new workspace" button is removed and `welcome.spec.ts` is updated. A guided "create named workspace" flow is a later feature.
- Notes in sub-folders are listed recursively as a flat list with the relative path; a folder tree is a later feature.
- Files larger than 5 MiB are not opened in the editor (message shown). Autosave debounce is 1 000 ms. Both are constants.

## 📝 Problem Statement

- The owner's note workflow needs plain Markdown files they own, on their disk, readable by any other tool (issue #8, brief Problems).
- Every later story builds on how this one handles paths, file access, errors and saving. If each feature talks to Tauri plugins ad hoc, images (E01-S03), sync (E02) and PDF annotation each re-solve path safety, error handling and testability. We pay for those primitives once, and only for the ones this story uses.

### Design constraints from the backlog

| Constraint       | Source                                       | Consequence here                                                                                           |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Local-first      | D05, owner 2026-10-25                        | Local files are the source of truth; no feature in this spec needs a network, account or server            |
| Plain files      | `BACKWARD_COMPATIBILITY.md` (Workspace on disk) | A workspace without `.basalt/` opens normally; nothing mandatory is written next to notes                  |
| Future custom syntax | Owner 2026-10-25                         | The editor stores the exact Markdown source and is built from extensions, so Basalt components can be added later |
| Sync later       | E02                                          | Identity of a note is its `WorkspacePath`; saves are atomic and conflict-checked                            |

## 📝 Proposed Solution

Build outward from ports. `@basalt/core` defines what the app needs from the world (a workspace-rooted file system, a directory picker, app settings) and implements use cases against those ports. Each port has a Tauri adapter (production) and an in-memory adapter (unit tests and Playwright), and a shared contract test suite that both must pass.

Alternatives considered:

- **Call `@tauri-apps/plugin-fs` directly from components/stores.** Fastest now; makes e2e impossible (Playwright runs the Vite app in plain Chromium, no Tauri runtime) and spreads path validation. Rejected.
- **A custom Rust command for file access.** Forbidden by AGENTS.md unless plugins cannot do the job; they can.
- **A hidden index database for notes.** Violates "no database" in the workspace model; an in-memory index can be added later behind the same use cases.
- **Textarea editor.** Cheapest, but the owner chose an Obsidian-style editor (Q5).
- **Registries for file kinds and commands now.** One file kind and three commands do not justify them (Q7).

## 📝 Architecture

```text
basalt-app/
├── src-tauri/            existing — gains plugin registration only (fs, dialog, persisted-scope)
└── packages/
    ├── core/             existing — ports, WorkspacePath, AppError/Result, note use cases, autosave (+ ./testing entry)
    ├── editor/           NEW (Phase 2) — framework-agnostic Markdown editor on CodeMirror 6
    ├── ui/               existing — gains shadcn Dialog, Input, Alert, ScrollArea
    ├── api/              existing — unchanged in this spec
    └── app/              existing — composition root, Tauri/memory platforms, features/, stores
```

Dependency direction (extends the standards spec; `editor` is a new leaf):

```text
app ──► core, ui, editor
editor ──► CodeMirror/Lezer only (no React, no Tauri, no @basalt/*)
core, ui, api ──► unchanged rules
```

**Why a new package for the editor.** CodeMirror is the largest, most volatile dependency of the app. A separate package keeps `core` free of browser globals and `ui` free of document logic, and gives the future Basalt components (Q10) one place to live. The React wrapper (`NoteEditor`) lives in `app`.

### Frontend primitives (all in `@basalt/core`)

1. **`AppError` and `Result<T>`**: discriminated union with a stable client-side `code` (`not-found`, `permission-denied`, `already-exists`, `invalid-path`, `conflict`, `too-large`, `not-utf8`, `unavailable`, `unknown`) and a safe `message`. Adapters map platform errors into it; UI maps `code` to user text. Never carries note content. Server errors (E02) get their own codes, mapped in `@basalt/api`.
2. **`WorkspacePath`**: branded string, a `/`-separated path relative to the workspace root. Produced only by `toWorkspacePath(input)`, which rejects absolute paths, drive letters, `..` and empty segments, `\`, NUL and control characters. Names are kept exactly as the file system returns them (no Unicode normalization), so any listed file can be opened. Comparison for collisions uses `pathKey(path)` = NFC + case fold. Adapters convert native separators to `/`; a file whose name contains `\` on Linux/macOS cannot be represented and is skipped by listing. This is the single place path safety lives; the fs scope is the second layer.
3. **Ports** (explicit injection, no service locator):
   - `WorkspaceAccess.open(root): Promise<Result<WorkspaceFileSystem>>`: verifies the root is reachable and authorized and returns a file system bound to it. `WorkspaceRoot` is an absolute, platform-native directory path, produced only by the picker or by restoring settings.
   - `WorkspaceFileSystem`: `list`, `stat`, `readText`, `writeTextAtomic`, `createExclusive`, `ensureDir`. Methods take `WorkspacePath`, never absolute paths.
   - `WorkspacePicker.pickDirectory(): Promise<Result<WorkspaceRoot | null>>`.
   - `AppSettingsStore`: `load()`, `save(settings)` for the app-level JSON (Data Model).
   No `Clock`, `IdGenerator` or `Logger` ports yet (YAGNI); autosave timing is injected as a scheduler function.
4. **File kinds**: `isMarkdownPath(path)` (case-insensitive `.md`). Replaced by a registry when E01-S03 adds images (Q7).
5. **Note use cases** (`createNotes({ fs })` returns `listNotes`, `openNote`, `createNote`, `saveNote`, `suggestNoteName`): all domain rules live here, not in React or in adapters: which entries are notes (Markdown only, skipping dot-entries, `.basalt/` and temp files), the 10 000-entry cap, naming and collisions, size limit, EOL/BOM handling, conflict detection and the atomic write sequence.
6. **Autosave** (`createAutosave({ save, schedule, delayMs })`): a small state machine, independent of React. Rules:
   - Writes only when the note is dirty; opening or viewing a note never writes.
   - Debounced `delayMs` after the last change; flushed immediately on Ctrl/Cmd+S, note switch, workspace change and window close.
   - At most one save in flight; changes made during a save schedule one follow-up save with the latest text.
   - On any error (including `conflict` and `not-found`) autosave pauses for that note until the owner resolves the banner; the text is never discarded.
   - Status for the UI: `saved | pending | saving | paused`.

### Platform adapters (`@basalt/app/src/platform/`)

- `tauri/`: `TauriWorkspaceAccess` / `TauriWorkspaceFileSystem` (`@tauri-apps/plugin-fs`), `TauriWorkspacePicker` (`@tauri-apps/plugin-dialog`, which extends the fs scope at runtime for the chosen directory), `TauriAppSettingsStore` (plugin-fs on `$APPCONFIG/basalt.json`).
- `memory/`: thin wiring around `@basalt/core/testing`'s in-memory file system. It persists its state to `localStorage` so it survives a page reload, and exposes a read-only `window.__basaltTestFs` inspector that Playwright uses to assert the exact bytes of saved files. Selected only when `VITE_BASALT_PLATFORM=memory` (Playwright's `webServer` sets it) through a dynamic import; a build check asserts the production bundle does not contain it.
- `createPlatform()` is the single selection point in the composition root.

### State and UI (`@basalt/app`)

- `features/workspace/` (store: `root`, `status`, `error`; actions `openWorkspace`, `restoreWorkspace`) and `features/notes/` (store: `notes[]`, `session { path, text, baseText, eol, bom, error, saveStatus }`). `isDirty = text !== baseText` is derived, not stored.
- Actions are plain functions taking the ports (created in the composition root and passed into stores), so containers stay thin and tests inject fakes.
- Presentational components (typed props, no store access): `WelcomeScreen`, `WorkspaceLayout`, `NoteList`, `NoteEditor` (wraps `@basalt/editor`), `NewNoteDialog`, `UnsavedChangesDialog`, `ErrorBanner`, `SaveStatus`. Containers connect them.
- Shortcuts (`Ctrl/Cmd+S`, `Ctrl/Cmd+N`, `Ctrl/Cmd+O`) are bound in one keymap module in `app`.

### Editor package (`@basalt/editor`)

`createMarkdownEditor(parent, { doc, onChange, extensions? })` returns `{ getText, setText, focus, destroy }`. Phase 2 ships source mode: Markdown language, history, line wrapping, a Basalt theme driven by CSS variables, all assembled from CodeMirror extensions through the `extensions` option. Phase 3 adds live preview as further extensions. The document is always the exact Markdown source (LF line endings in memory); no editor-only metadata is ever written to the note. Future Basalt components (Q10) are added as extensions over a Markdown-compatible syntax, so the notes stay readable in other editors.

## 📝 Data Model

- **Workspace on disk:** a note is a `.md` file; its identity is its relative path; its title is the file name without extension. Nothing is injected into notes (no front matter, no sidecars). Temporary files `.<name>.basalt-tmp` exist only during a save and are never listed.
- **`.basalt/` in the workspace (optional):** `.basalt/workspace.json` = `{ "version": 1, "lastOpenedNote": "<WorkspacePath> | null" }`. Created on first write, never required: a workspace without it, or with an unreadable/invalid one, opens normally (invalid content is ignored and overwritten on the next write). Its content is validated at runtime. Future workspace settings go here, like Obsidian's `.obsidian/`.
- **App-level settings:** `$APPCONFIG/basalt.json` = `{ "version": 1, "lastWorkspace": "<WorkspaceRoot> | null" }`, like Obsidian's `obsidian.json`. The last workspace cannot live inside the workspace, because the app must know it before it can open the workspace. Validated at runtime; invalid content means "no last workspace".
- **In memory:** `Note { path: WorkspacePath, name }`, `NoteSession` (above).

### Line endings and BOM

1. On open, the file is decoded as UTF-8 (invalid → `not-utf8`, never written). A leading BOM is removed and remembered (`bom: boolean`). The dominant line ending (`lf` | `crlf`) is detected and remembered (`eol`). The text is converted to LF; this is both the editor text and `baseText`.
2. On save, LF is converted to `eol` and the BOM is restored if it was present. A uniform file therefore round-trips byte for byte.
3. A file with mixed line endings is written with its dominant ending. This only happens after the owner actually edits it, because unedited notes are never written (autosave rule 1). Documented limitation.
4. The conflict check compares the **normalized** disk text (LF, no BOM) with `baseText`. A change of only line endings or BOM on disk is not a conflict; the save then uses the style found on disk.

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
    ensureDir(path: WorkspacePath): Promise<Result<void>>; // used for .basalt/
}

interface WorkspacePicker {
    pickDirectory(): Promise<Result<WorkspaceRoot | null>>; // null = user cancelled
}

interface AppSettingsStore {
    load(): Promise<Result<AppSettings>>;
    save(settings: AppSettings): Promise<Result<void>>;
}

interface NoteService {
    listNotes(): Promise<Result<{ notes: readonly Note[]; truncated: boolean }>>;
    openNote(path: WorkspacePath): Promise<Result<OpenedNote>>; // { text, eol, bom }; too-large via stat before reading; symlink → invalid-path
    suggestNoteName(existing: readonly Note[]): string; // first free of "Untitled", "Untitled 1", ...
    createNote(name: string): Promise<Result<Note>>; // already-exists, invalid-path; never auto-suffixes
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

`saveNote` sequence: `stat` the file; if it is missing → `not-found` unless `mode: "recreate"`; if size and mtime match the values recorded at the last read/write, skip the re-read; otherwise re-read and, if the normalized text differs from `baseText`, return `conflict` unless `mode: "overwrite"`; then `writeTextAtomic`.

Tauri capability (`capabilities/default.json`) gains least-privilege entries only: `dialog:allow-open`, `fs:allow-read-dir`, `fs:allow-read-file`, `fs:allow-write-file`, `fs:allow-rename`, `fs:allow-remove` (temp cleanup), `fs:allow-stat`, `fs:allow-lstat`, `fs:allow-mkdir`; fs scope `$APPCONFIG/basalt.json` at build time, plus the picked directory at runtime only. No `$HOME/**`. Window permissions needed by the close guard (expected: `core:window:allow-destroy`) are confirmed in the Phase 2 spike.

## 📝 UI/UX

- **No workspace:** welcome screen with one "Open folder as workspace" action (native picker, which can also create a folder). Cancel leaves the screen unchanged.
- **Workspace open:** left sidebar lists notes (relative path, sorted case-insensitively), "New note" button, workspace name with a "Change workspace" action. The last opened note is reopened. Empty workspace shows "Create your first note".
- **New note:** dialog with a name field prefilled with `suggestNoteName` (`Untitled`, or `Untitled 1` if taken, ...). If the owner types a name that is invalid or already exists, an inline message is shown and the Create button is disabled. No hidden renaming.
- **Editing and saving:** autosave; a `SaveStatus` indicator shows "Saved" / "Saving…" / "Not saved". Ctrl/Cmd+S saves immediately.
- **Leaving a note** (switch note, change workspace, close window): pending changes are flushed. Only if that save fails does the Save-failed dialog appear, with Retry / Discard changes / Cancel.
- **Errors:** a persistent `role="alert"` banner above the editor with the reason and actions; autosave stays paused until it is resolved. The editor text is never cleared by an error.
- **Accessibility:** the note list is a labelled `listbox` (`aria-selected`, arrow-key navigation); dialogs trap focus (Radix); the banner is announced to screen readers.
- Prototype: none.

## 📝 Edge Cases & Failure Scenarios

| Scenario                                                          | Behavior                                                                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directory not writable (AC3)                                      | Save returns `permission-denied`; banner with Retry; autosave paused; editor text and dirty state kept; the original file is unmodified (failure before rename). |
| Create note in a read-only workspace                              | `createExclusive` fails; inline error; no ghost entry in the list.                                                                                          |
| `.basalt/` not writable                                           | Workspace still works; remembering the last note silently fails (logged without paths or content).                                                          |
| Crash/failure between temp write and rename                       | Original intact; the stray `.basalt-tmp` is ignored by listing and removed on the next successful save of that note.                                       |
| File changed on disk by another editor after it was opened        | `conflict`; autosave paused; banner offers "Keep my version" (`overwrite`) or "Load version from disk" (discards local edits after confirmation).            |
| File deleted or moved externally while open                       | `not-found`; autosave paused (it must not silently resurrect a file the owner deleted elsewhere); banner offers "Save again here" (`recreate`) or "Close note" (after confirmation if dirty). |
| Workspace folder deleted/renamed while open, no unsaved changes   | `unavailable`; app returns to the welcome screen with an explanatory notice; `lastWorkspace` is kept.                                                      |
| Workspace folder deleted/renamed while open, unsaved changes      | The editor stays open with the text; banner explains and offers Retry or "Change workspace" (the Save-failed dialog runs first).                            |
| Last workspace no longer exists or scope was lost on launch       | Welcome screen with a notice; no crash.                                                                                                                     |
| Non-UTF-8 file                                                    | Listed; opening shows `not-utf8`; never written.                                                                                                            |
| File larger than 5 MiB                                            | Listed; opening shows `too-large` (decided by `stat`, without reading the file).                                                                           |
| CRLF, BOM, mixed line endings                                     | See "Line endings and BOM".                                                                                                                                 |
| Name issues (`..`, `/`, `\`, `:*?"<>\|`, Windows reserved names, trailing dot/space, > 255 bytes, case-only or Unicode-form-only collisions) | Rejected by `validateNoteName` with an inline message; collisions compared with `pathKey`.                     |
| Very large workspace                                              | Listing capped at 10 000 notes with a visible "showing first 10 000" notice.                                                                                |
| Symlinks                                                          | Not followed in listing; opening or saving a symlink path is rejected as `invalid-path` (detected with `stat`).                                            |
| User cancels the picker                                           | No state change, no error.                                                                                                                                  |
| Typing during a save                                              | One follow-up save with the latest text; no lost keystrokes, no overlapping writes.                                                                         |

## 📝 Risks & Impact Review

- **Hard to reverse:** `WorkspacePath`, the on-disk shape and the `.basalt/` layout become the foundation for sync and E2EE. Mitigated by keeping `.basalt/` optional and versioned, and adding nothing to notes. Widening the Tauri fs scope later is a protected-surface change.
- **Future lock-in (Q10):** custom Basalt components will make some notes depend on Basalt. Not built here; the extension-based editor and the "exact source" rule keep that decision open. It needs its own spec with a graceful-degradation rule.
- **Standards drift.** Adding `@basalt/editor` extends the "current" standards spec and README package list; Phase 2 updates both in the same PR.
- **Unverified platform assumptions** (Phase 2 spike, step 1): the dialog plugin extends the fs scope at runtime for a picked directory; `tauri-plugin-persisted-scope` keeps it across restarts; plugin-fs refuses symlink escapes; `stat` reports symlinks without following; rename within scope replaces atomically on Windows and Linux; the close-guard window permissions. If any is false, the fallback is the one in the standards spec (a narrowly scoped custom command), which needs its own spec.
- **Autosave writes often.** Each save is an atomic write plus a `stat`; the re-read only happens when the file changed on disk. Acceptable for ≤ 5 MiB notes.
- **Editor scope creep.** "Like Obsidian" is open-ended. Phase 3 is bounded to its element list; anything else needs a new story.
- **What tests can and cannot prove.** Playwright runs against the memory platform, so it proves app behavior, not real disk behavior. The Tauri adapters get unit tests for error mapping with mocked IPC, which do not prove plugin behavior. Real file-system behavior is covered by the spike results (recorded as a lesson) and a manual smoke test on a built desktop app (Linux and Windows) documented in the Phase 2 PR.
- **Market check (general knowledge, not freshly verified).** Obsidian: vault is a folder, live preview on CodeMirror 6, `.obsidian/` per vault and `obsidian.json` in the app config — the model followed here. Logseq: a derived database needed re-indexing and caused drift — we keep no index on disk.

## 📝 Decisions in play

- **D05** (MVP includes Markdown notes, offline-first) — this spec implements Markdown notes; the owner clarified offline-first as local-first (Q11).
- **D02** (built for the owner first) — justifies defaults such as one remembered workspace and no polish beyond the acceptance criteria.
- **N02** (no Cloud work now) — respected; no server work at all in this spec.
- **N03** (no tags, backlinks, graph, themes) — respected; the editor package is not a backdoor for them.
- **N01** (no iOS/web in the MVP) — respected; the memory platform is a test harness, excluded from production bundles.
- Nothing proposed supersedes an active entry.

## 📋 Phasing

1. **Phase 1 — Core primitives.** Errors, paths, ports, note use cases, autosave, in-memory FS and contract suite. No visible change; the app keeps working.
2. **Phase 2 — E01-S01 on desktop.** Tauri plugins and capability, adapters, editor package (source mode), stores, workspace UI, e2e. Closes issue #8.
3. **Phase 3 — Live-preview editor.** Extracted into its own spec and issue when issue #8 closes (Q1); listed here so the editor API is designed for it.

Phases 1→2→3 are sequential.

## 📋 Implementation Plan

Each step is testable and leaves the app working. Vitest next to code, Playwright in `basalt-app/e2e/`.

### Phase 1 — Core primitives

1. `AppError`, `Result`, helpers (`ok`, `err`, `mapError`). Tests: exhaustive code handling.
2. `toWorkspacePath`, `pathKey`, `validateNoteName`. Tests: traversal (`../x`, `a/../../b`), absolute and drive paths, `\`, NUL, NFD names kept as-is but colliding with NFC under `pathKey`, Windows reserved names, trailing dot/space, length, case-only collisions.
3. Port interfaces plus `@basalt/core/testing` with `createInMemoryWorkspaceFileSystem` (read-only mode, `failNextWrite`, symlink entries, serializable state) and `describeWorkspaceFileSystemContract(factory)`. Tests: the in-memory FS passes the contract (atomic write leaves the original on failure, `createExclusive` refuses overwrite, `stat` reports symlinks without following).
4. Note use cases and `isMarkdownPath`. Tests: listing filters (non-Markdown, dot-entries, `.basalt/`, temp files, cap and `truncated`), `suggestNoteName`, `createNote` collisions, `too-large` without reading, `not-utf8`, symlink rejection, EOL/BOM round trip byte for byte, mixed-EOL rule, EOL-only disk change is not a conflict, `conflict`/`overwrite`, `not-found`/`recreate`, and the AC3 scenario (write fails → error returned, original untouched).
5. Autosave state machine with an injected scheduler. Tests: no write when clean, debounce, flush, single in-flight save with one follow-up, pause on error and resume after resolution.
6. Settings schemas and parsers for `basalt.json` and `.basalt/workspace.json`. Tests: valid, missing, malformed and future-version input.

### Phase 2 — E01-S01 on desktop

1. Spike and register `tauri-plugin-fs`, `-dialog`, `-persisted-scope` (only `lib.rs` plugin lines, `Cargo.toml`, `capabilities/default.json`, npm packages). Verify the Risks assumptions on Linux and Windows; record results in a lesson. `rust:fmt`/`rust:lint` stay green.
2. Tauri adapters (`WorkspaceAccess`, `WorkspaceFileSystem`, `WorkspacePicker`, `AppSettingsStore`). Unit tests for plugin-error → `AppError` mapping and path conversion with `@tauri-apps/api/mocks`.
3. Memory platform (persistence across reload, `__basaltTestFs` inspector), `createPlatform()`, Playwright `webServer` env, production-bundle check.
4. `@basalt/editor` package (workspace entry, `tsconfig`, eslint/vitest wiring) with source mode. Tests: `onChange` fires on edits, `setText` does not echo `onChange`, `extensions` compose, `destroy` detaches.
5. `@basalt/ui`: add shadcn `Dialog`, `Input`, `Alert`, `ScrollArea` with rendering/accessibility tests.
6. Workspace and note stores/actions; `restoreWorkspace` (last workspace, last note) on launch. Tests with fake ports: open, cancel, restore failure, error mapping, dirty derivation, failure keeps text.
7. Presentational components and containers; single welcome action; keymap; autosave wiring with `SaveStatus`; flush on leave and Save-failed dialog; Tauri window close guard; conflict and deleted-file banners.
8. Playwright specs (memory platform): open a workspace and see Markdown files listed; create a note, type, wait for "Saved", reload and see the content, and assert the bytes through `__basaltTestFs`; read-only workspace shows the error and keeps the text (AC3); conflict banner; deleted-file banner; save-failed dialog; last workspace and note restored; update `welcome.spec.ts`.
9. Docs: README workspace section (local-first, `.basalt/`), standards spec and README package list (`@basalt/editor`), `.ai/lessons`, run log. Extract Phase 3 into its own spec and move this one to `implemented/` (Q1).

### Phase 3 — Live-preview editor (to be extracted)

1. Theme tokens for preview styles. Test: default config unchanged.
2. Marker-hiding decorations for headings, emphasis, strong, inline code; source shown on the active line/selection. Tests on decoration sets for given states.
3. Links, lists, task lists, blockquotes, fenced code styling. Tests as above.
4. Playwright: typing Markdown renders the styled result; cursor entry reveals source; saved file text is the exact source.

### Acceptance criteria traceability (issue #8)

| Criterion                                                       | Verified by                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Choose a directory → app opens it and lists its Markdown files  | Phase 1 step 4 listing tests; Phase 2 step 6 store tests; step 8 e2e                             |
| Create, edit, save → `.md` file with that content exists        | Phase 1 steps 4–5; Phase 2 step 8 e2e (bytes asserted in the memory FS); manual smoke on a built desktop app |
| Not writable → error shown, unsaved text kept (proposed)        | Phase 1 step 4; Phase 2 step 6 store test; step 8 e2e                                            |
