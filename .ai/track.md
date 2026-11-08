# Implementation tracker

Spec: `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (E01-S01, issue #8).
Started: 2026-11-08. Branch: `session/9033e9-lesson8`.

Rules: tasks run in order, each one implemented by a subagent, each one committed when done. After each phase there is a manual test checkpoint. Phase 3 (live-preview editor) is extracted into its own spec (Q1) and is not implemented here.

Legend: `[ ]` todo, `[x]` done.

## Phase 1: Core primitives (PR 1)

Manual test checkpoint: no visible change; run `npm test` in `basalt-app` and confirm the app still starts and shows the welcome screen.

- [x] 1.1 `AppError`, `Result`, helpers (`ok`, `err`, `mapError`)
- [x] 1.2 `toWorkspacePath`, `pathKey`, `validateNoteName`
- [x] 1.3 Port interfaces, `@basalt/core/testing` in-memory file system and `describeWorkspaceFileSystemContract`
- [x] 1.4 Note use cases and `isMarkdownPath`
- [x] 1.5 Autosave state machine
- [x] 1.6 Workspace watcher handling
- [x] 1.7 Settings schema and parser for `basalt.json`

## Phase 2a: Platform and building blocks (PR 2)

Manual test checkpoint: the app still shows the welcome screen; Storybook/unit tests show the new `@basalt/ui` primitives; `npm run tauri dev` starts with the new plugins registered.

- [x] 2a.1 (Rust side UNVERIFIED, see notes) Tauri plugins (`fs` with `watch`, `dialog`, `persisted-scope`), capabilities, platform spike
- [x] 2a.2 (verified against mocks only) Tauri adapters (`WorkspaceAccess`, `WorkspaceFileSystem`, `WorkspacePicker`, `AppSettingsStore`)
- [x] 2a.3 Memory platform, `createPlatform()`, Playwright `webServer` env, production-bundle check
- [x] 2a.4 `@basalt/editor` package (source mode)
- [x] 2a.5 i18n (`i18next`, `locales/en.json`, typed keys, `errors.*`)
- [x] 2a.6 `@basalt/ui` primitives: `Dialog`, `Input`, `Alert`, `ScrollArea`
- [x] 2a.7 Docs: standards spec and README package list

## Phase 2b: E01-S01 on desktop (PR 3)

Manual test checkpoint: full manual test of the app (open a workspace, create a note, type, autosave, external edits, errors) in the browser on the memory platform and, where possible, in the Tauri desktop app.

- [x] 2b.1 Workspace and note stores/actions, `restoreWorkspace`
- [x] 2b.2a (window behaviour UNVERIFIED) Custom window chrome: native Tauri title bar disabled (`decorations: false`, window permissions for minimize/maximize/close/drag), HTML title bar built from the `@basalt/ui` window shell components as in `prototypes/workspace-basic`; works on the memory platform without Tauri
- [x] 2b.2b Welcome screen wiring: workspace store connected to the picker, open workspace, restore last workspace, notices (AC-01.4 to AC-01.6, AC-01.20, keymap module)
- [x] 2b.2c Workspace layout: sidebar with flat note list, empty state, live refresh via watcher and focus fallback, collapse animation, Ctrl/Cmd+N instant new note (AC-01.7 to AC-01.10)
- [x] 2b.2d Editor and tabs: `NoteEditor` wrapping `@basalt/editor`, open tabs with dirty dot, per-workspace tab restore (AC-01.16, AC-01.17), note error states (AC-01.15)
- [x] 2b.2e (close guard UNVERIFIED) Autosave and status bar: autosave wiring with `SaveStatus` (AC-01.11, AC-01.19), flush on leave, Save-failed dialog (AC-01.13), Tauri close guard
- [ ] 2b.2f External changes: clean reload, dirty conflict banner, deleted-file banner, unavailable workspace, confirmation dialogs (AC-01.12, AC-01.14, AC-01.5)
- [ ] 2b.3 Playwright specs (memory platform), update `welcome.spec.ts`
- [ ] 2b.4 Docs: README, lessons, run log, move spec to `implemented/`

## Notes

- Owner decision (2026-11-08): the native Tauri title bar must not be visible; the window uses a custom HTML title bar like the prototype (task 2b.2a).
- Acceptance criteria AC-01.1 to AC-01.20 come from the spec; each needs a Vitest test and a Playwright test.
- Open issues and deviations are recorded here as they appear.
- For 2a.2: the Tauri `readText` must keep a leading BOM (decode with `ignoreBOM: true`); note use cases detect BOM from the returned text. `listNotes` lists nested Markdown files; `createNote` is root-only and rejects dot-leading names.
- For 2b.1/1.6: autosave has no `rebase(text)`; a watcher reload that changes baseText needs one (or recreate the autosave). The follow-up save after an in-flight save runs immediately, without a second debounce.
- For 2a.2: `AppSettingsStore.save` should skip writing when the file on disk has a higher version, so a downgraded app does not overwrite newer settings.
- 2a.1 caveats: sandbox has cargo 1.65 / rustc 1.63 and no webkit2gtk, so `cargo check`, `rust:fmt`, `rust:lint` and `tauri dev` were NOT run. `Cargo.lock` is not updated: run `cargo check` on a real machine and commit the lock. Capabilities JSON not validated against a generated schema. All runtime spike assumptions (dialog extends scope, persisted-scope, symlink refusal, lstat, atomic rename, recursive watch, root-deletion event, close guard) are UNVERIFIED; Windows untested.
- 2a.1 open: build-time fs scope `$APPCONFIG/basalt.json` does not cover `$APPCONFIG` (mkdir) or temp files like `basalt.json.tmp` (atomic write, remove). Probably needs widening; decide in a real-device spike.
- 2a.2 caveats: adapters are verified only against an in-memory fake of plugin-fs IPC (`platform/tauri/testing/fake-plugin-fs.ts`), not the real plugin. Unproven: real error wording (esp. Windows), scope enforcement, symlink flags, atomic rename, Windows paths, real watch event shapes and whether root deletion emits an event carrying the root path (root-lost detection depends on it), mtime units. `writeTextAtomic`/`createExclusive` call `mkdir({recursive:true})` on the parent, a wider use of `fs:allow-mkdir` than the spec states. Settings save will likely be refused by the real scope until it is widened (see 2a.1 open).
- 2a.3: `main.tsx` awaits `createPlatform()` but does not use the result yet (wired in 2b). Core has an extra subpath export `@basalt/core/testing/in-memory` because `@basalt/core/testing` imports vitest and cannot run in the browser. CI runs `npm run check:bundle` after build.
- 2a.4: `setText` resets undo history (so Ctrl+Z cannot restore stale text after a silent disk reload) and keeps the clamped selection. README package list and standards spec are updated in 2a.7.
- 2a.5: welcome screen now has a single inert "Open folder as workspace" button (wired in 2b). `errors.permission-denied` carries the read-only message. `packages/app` tests using `toBeInTheDocument` must import `@testing-library/jest-dom/vitest`.
- 2a.6: Dialog, Input and Alert already existed in `@basalt/ui`; added `ScrollArea` (Radix) and an `Alert` `role` override (banners need `role="alert"` on the warning variant), plus tests. Do not run `prettier --write` over `packages/ui` (reformats MDX that `format:check` ignores).
- 2a.7: root README still says `core` has "encryption primitives" and `ui` "depends only on @basalt/core for types"; both were already inaccurate before this work and are left untouched. The `app -> editor` direction is documented but not lint-enforced (app has no import restrictions).
- 2b.1: stores use `zustand/vanilla`; services built by `createServices(platform, ...)` and provided via `ServicesProvider`. Added `rebase(text)` to core autosave (ignores a stale in-flight save). Left for later tasks: watcher wiring and `watchMode` updates (2b.2c), conflict actions "Keep my version"/"Save again here" and root-lost flow (2b.2f), window-close flush (2b.2e). If the stored `activeNote` is dropped on restore the first remaining tab becomes active (spec silent). `settings-writer` has no dedicated unit test.
- 2b.2a: native decorations off (`decorations: false`, min 480x360, 1000x700), custom `TitleBar` from `@basalt/ui` mounted via `AppWindowContainer`; new app-level `WindowChrome` port (Tauri adapter, inert memory adapter). UNVERIFIED (no GUI/OS here): the five `core:window:allow-*` identifiers (derived from `plugin:window|*` command names), drag, double-click maximize, minimize/maximize/close, edge resizing of an undecorated window, `onResized` firing on maximize, shadow/rounded corners, macOS behaviour. Close button calls `window.close()` so the close guard (2b.2e) can hook in. The welcome header still shows a "Basalt" brand link next to the title bar title; revisit in 2b.2b.
- 2b.2b: welcome screen is wired (open, cancel, error and notice alerts, busy state); `AppContainer` calls `restoreWorkspace()` once and routes startup/welcome/placeholder; the workspace placeholder is TEMPORARY until 2b.2c. Memory-platform picker defaults to the built-in `/demo` workspace (Welcome.md, Ideas.md, projects/Roadmap.md, attachments/readme.txt); `setPickerResult(null)` cancels, `setPickerResult(path)` opens a path, `setPickerResult(undefined)` restores the demo default. Only Ctrl/Cmd+O is bound; Ctrl/Cmd+N goes in 2b.2c, Ctrl/Cmd+S in 2b.2e. The welcome header "Basalt" brand was removed (title bar carries the name). Edge: Ctrl+O just before restore starts can open a picker. README got one sentence about the demo picker (fold into 2b.4).
- 2b.2c: real workspace layout (sidebar with folder name, no "Change workspace" button, collapse animation via `--bs-motion-panel-duration`, flat listbox, empty and error states), watcher wiring (300 ms, `refreshNotes`, `watchMode`, focus fallback with notice, stopped on leave), Ctrl/Cmd+N and New note button (serialized `createNote`, `createError` shown in sidebar). Root-lost with no unsaved text returns to Welcome with `workspace-unavailable`; with unsaved text it does nothing yet (banner and Retry/Change workspace are 2b.2f). Main area shows "No note open" until 2b.2d (editor, tabs and the "cursor in editor" half of AC-01.10). Gaps: `TitleBar` "Toggle sidebar", `ActivityBar` "Sections" and "Window title bar" labels are hardcoded English inside `@basalt/ui`, so untranslated. Status bar empty until 2b.2e. Older e2e tests that use `__basaltTestFs` straight after `goto` can race (the new `openWorkspaceWith` helper in `e2e/support.ts` waits for the button).
- 2b.2d: one CodeMirror instance per open readable note (inactive ones `hidden`, keeping undo/cursor/scroll per tab; memory grows with tab count since there is no limit). Tabs reuse `@basalt/ui` `TitleBar` tabs (tabs live in the title bar as in the prototype) with real tablist/tab semantics, arrow/Home/End keys, middle-click close. `closeTab` flushes first; a failed flush keeps the tab open until the Save-failed dialog exists (2b.2e). `NoteSession.openFailed` separates failed opens from failed saves; open errors show an Alert and mount no editor. AC-01.10 is now complete (focus request after New note / open from list). Open issues: (1) axe `aria-required-children` disabled in TitleBar/MainScreen stories because close buttons sit inside the tablist; (2) memory platform `persist()` now swallows localStorage quota errors; (3) `markdown()` continues list markers on Enter, so typing `- one`, Enter, `- two` saves `- one\n- - two` (saved file equals editor text, not literal keystrokes) — decide in 2b.4 or Phase 3; (4) TitleBar tab labels ("Open notes", "Close {name}", "not saved", "Show all open notes") are hardcoded English in `@basalt/ui`; (5) clicking blank space below the text does not focus the editor.
- 2b.2e: status bar shows only Saved / Saving… / Not saved (`pending` and `paused` both "Not saved"); Ctrl/Cmd+S bound when a workspace is open; reusable `ErrorBanner` (Alert `role="alert"`, sticky, action slot, `variant` danger|warning) for save errors with Retry; Save-failed dialog (Retry / Discard changes / Cancel, initial focus on Cancel, Escape = Cancel) driven by `leave-store` data (`close-tab` | `change-workspace` | `close-window`); `WindowChrome` port gained `destroy()` and `onCloseRequested`. App-local `SaveFailedDialog` is used because the `@basalt/ui` one hardcodes English and focuses Retry. Tab switching flushes the note being left but never blocks (failure shows the banner; text stays because tabs stay mounted). UNVERIFIED (no GUI): Tauri `onCloseRequested` awaiting an async handler, `preventDefault` then `destroy()`, whether `allow-destroy` alone is enough. For 2b.2f: `NoteEditorAreaContainer` shows the banner for any non-open-failure `session.error`, so branch on `conflict`/`not-found` there; root lost while the Save-failed dialog is open is unhandled; Discard on a workspace change does not roll back if opening the new folder fails; `status: opening` briefly unmounts the workspace screen on a workspace-to-workspace switch.
