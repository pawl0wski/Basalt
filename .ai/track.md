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
- [ ] 2a.5 i18n (`i18next`, `locales/en.json`, typed keys, `errors.*`)
- [ ] 2a.6 `@basalt/ui` primitives: `Dialog`, `Input`, `Alert`, `ScrollArea`
- [ ] 2a.7 Docs: standards spec and README package list

## Phase 2b: E01-S01 on desktop (PR 3)

Manual test checkpoint: full manual test of the app (open a workspace, create a note, type, autosave, external edits, errors) in the browser on the memory platform and, where possible, in the Tauri desktop app.

- [ ] 2b.1 Workspace and note stores/actions, `restoreWorkspace`
- [ ] 2b.2 Presentational components, containers, keymap, autosave and watcher wiring, banners, dialogs, close guard
- [ ] 2b.3 Playwright specs (memory platform), update `welcome.spec.ts`
- [ ] 2b.4 Docs: README, lessons, run log, move spec to `implemented/`

## Notes

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
