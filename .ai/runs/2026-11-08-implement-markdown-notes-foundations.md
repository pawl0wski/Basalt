---
date: 2026-11-08
slug: implement-markdown-notes-foundations
type: run
status: completed
tags: [notes, workspace, tauri, editor, autosave, watcher, i18n, e01, e2e]
---

# Run: implement Markdown notes (E01-S01) and the application foundations

## Goal

Implement `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (issue #8, E01-S01) by delegating one task per subagent from the tracker `.ai/track.md`, committing each task: Phase 1 (core primitives), Phase 2a (platform and building blocks), Phase 2b (E01-S01 on desktop). Phase 3 (live-preview editor) was out of scope and is extracted into its own spec.

## What was done

Phase 1, core primitives:

- `848346b` AppError and Result
- `090ace9` WorkspacePath, pathKey, validateNoteName
- `59b24f6` workspace ports, in-memory file system and contract suite
- `c649a73` note use cases with EOL/BOM handling and conflict detection
- `4a7ee4c` autosave state machine
- `d5f7165` workspace watcher and open-note change resolution
- `22f71bd` `basalt.json` settings schema and parser

Phase 2a, platform and building blocks:

- `e5ae516` Tauri fs, dialog and persisted-scope plugins with least-privilege capabilities (Rust side not built)
- `d51085c` Tauri platform adapters (verified against a fake plugin-fs only)
- `139f20a` memory platform, `createPlatform`, production bundle check
- `c07a0c1` `@basalt/editor` (CodeMirror 6, source mode)
- `fbdd110` typed i18n with English resources, presentational welcome screen
- `7d546a2` `@basalt/ui` ScrollArea, Alert role override, accessibility tests
- `6a093ae` standards spec and README package list

Phase 2b, E01-S01 on desktop:

- `f1e8944` workspace and notes stores, actions, autosave `rebase`
- `4b8810e` custom HTML title bar, native decorations disabled (owner decision, 2b.2a)
- `57ee372` welcome screen wiring, restore, notices, Ctrl/Cmd+O
- `f9d6643` workspace layout, note list, watcher refresh, instant new note
- `5349310` note editor, tabs with dirty dot, tab restore, open-error states
- `65e90f9` status bar, Ctrl/Cmd+S, save error banner, Save-failed dialog, close guard
- `5da471c` external changes, conflict and deleted-file banners, lost workspace
- `42ed387` e2e completion: round-trip specs, `gotoWelcome` helper
- Task 2b.4 (this run's last step, uncommitted at the time of writing): README workspace section, lessons, run log, the live-preview spec and the "Implementation status" section in the main spec.

Bookkeeping commits: `0c2cf7b` (tracker) and `5e38fd1` (split 2b.2 and add the window chrome task).

## Decisions

- Owner decision (2026-11-08): no native title bar; custom HTML title bar like the prototype.
- Memory platform as the e2e target (G6); `@basalt/core/testing/in-memory` subpath so the browser does not import vitest; `npm run check:bundle` keeps the memory platform out of production bundles.
- Core autosave gained `rebase`, `pause(error)` and `forceSave()`; the follow-up save runs without a second debounce.
- App-local `SaveFailedDialog` instead of the `@basalt/ui` one (that one hardcodes English and focuses Retry).
- Task 2b.2 was split into 2b.2a to 2b.2f.
- Phase 3 extracted into `.ai/specs/2026-11-08-live-preview-editor.md` (Q1). The main spec was not moved to `implemented/` and its status stays `draft`, because the desktop behavior is unverified (see below) and the manual smoke test is outstanding; an "Implementation status" section records this.
- Run status is `completed`: every planned task including 2b.4 was done. The manual desktop smoke test is a human step that the spec assigns to the Phase 2b PR, not an interrupted part of this run. Read this status together with the open items below; the feature is not yet verified on a real desktop.

## Outcomes

- `npm test` (basalt-app): 77 test files, 838 tests passed.
- `npm run test:e2e`: 77 Playwright tests passed (memory platform). Three consecutive green runs were recorded during task 2b.3.
- E2E audit against AC-01.1 to AC-01.20 found no product bugs.
- Acceptance criteria covered by Vitest and Playwright, except as listed under open issues.

## Open issues and UNVERIFIED items (from `.ai/track.md`)

Unverified:

- 2a.1: the sandbox had cargo 1.65 and rustc 1.63 and no webkit2gtk, so `cargo check`, `rust:fmt`, `rust:lint` and `tauri dev` were not run. `Cargo.lock` is not updated: run `cargo check` on a real machine and commit the lock. Capabilities JSON was not validated against a generated schema. All runtime spike assumptions are UNVERIFIED: dialog extends scope, persisted-scope, symlink refusal, lstat, atomic rename, recursive watch, root-deletion event, close guard. Windows is untested.
- 2a.1: the build-time fs scope `$APPCONFIG/basalt.json` does not cover `$APPCONFIG` (mkdir) or temp files like `basalt.json.tmp` (atomic write, remove). It probably needs widening; decide in a real-device spike. Settings save will likely be refused by the real scope until then. Review fix: the scope now allows `$APPCONFIG`, `$APPCONFIG/basalt.json` and `$APPCONFIG/basalt.json.tmp`, guarded by a Vitest test over the capability JSON; still UNVERIFIED on a real desktop. `AppSettingsStore.save` now returns `unavailable` when the disk version is newer and `settings-writer` no longer caches unsaved values (unit test added).
- 2a.2: adapters are verified only against an in-memory fake of plugin-fs IPC. Unproven: real error wording (especially Windows), scope enforcement, symlink flags, atomic rename, Windows paths, real watch event shapes, whether root deletion emits an event carrying the root path (root-lost detection depends on it), mtime units. `writeTextAtomic` and `createExclusive` call `mkdir({recursive:true})` on the parent, a wider use of `fs:allow-mkdir` than the spec states.
- 2b.2a: the five `core:window:allow-*` identifiers (derived from `plugin:window|*` command names), drag, double-click maximize, minimize/maximize/close, edge resizing of an undecorated window, `onResized` on maximize, shadow and rounded corners, macOS behavior.
- 2b.2e: Tauri `onCloseRequested` awaiting an async handler, `preventDefault` then `destroy()`, whether `allow-destroy` alone is enough.
- 2b.2f: real Tauri root-deletion events and recovery after the folder returns; `retryLost` reuses the already-open FS handle, untested on Tauri.
- Manual desktop smoke test (Linux and Windows) still to do.

Open issues and deviations:

- 2b.1: `settings-writer` has no dedicated unit test. If the stored `activeNote` is dropped on restore, the first remaining tab becomes active (spec silent). `AppSettingsStore.save` should skip writing when the file on disk has a higher version (not done).
- 2b.2b: Ctrl+O just before restore starts can open a picker.
- 2b.2c: `TitleBar` "Toggle sidebar", `ActivityBar` "Sections" and "Window title bar" labels are hardcoded English in `@basalt/ui`.
- 2b.2d: axe `aria-required-children` is disabled in TitleBar/MainScreen stories because close buttons sit inside the tablist; TitleBar tab labels are hardcoded English in `@basalt/ui`; clicking blank space below the text does not focus the editor; no tab limit (one CodeMirror instance per open note); `markdown()` continues list markers on Enter, so the saved text is not the literal keystrokes (carried to the live-preview spec).
- 2b.2e: root lost while the Save-failed dialog is open is unhandled; Discard on a workspace change does not roll back if opening the new folder fails.
- 2b.2f: a failed workspace-to-workspace open is not shown to the user while a workspace is open; no busy indicator during that switch; a deleted note whose file reappears with exactly the base text keeps its deleted banner.
- 2b.3: AC-01.18 (live preview) is Phase 3 (only negative checks exist); AC-01.6 failed-listing Retry and AC-01.15 symlink and unknown-error messages have Vitest only (the memory test handle cannot fail a listing or read, or create a symlink after listing; needs new hooks); the workspace-unavailable banner has no geometry assertion.
- 2a.7: root README still says `core` has "encryption primitives" and `ui` "depends only on @basalt/core for types"; both were inaccurate before this work and were left untouched. The `app -> editor` direction is documented but not lint-enforced.
- Task 2b.4 did not update the tracker (`.ai/track.md` row 2b.4 stays unchecked) or the main spec status.
