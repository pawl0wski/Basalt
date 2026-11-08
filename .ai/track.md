# Implementation tracker

Spec: `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (E01-S01, issue #8).
Started: 2026-11-08. Branch: `session/9033e9-lesson8`.

Rules: tasks run in order, each one implemented by a subagent, each one committed when done. After each phase there is a manual test checkpoint. Phase 3 (live-preview editor) is extracted into its own spec (Q1) and is not implemented here.

Legend: `[ ]` todo, `[x]` done.

## Phase 1: Core primitives (PR 1)

Manual test checkpoint: no visible change; run `npm test` in `basalt-app` and confirm the app still starts and shows the welcome screen.

- [x] 1.1 `AppError`, `Result`, helpers (`ok`, `err`, `mapError`)
- [x] 1.2 `toWorkspacePath`, `pathKey`, `validateNoteName`
- [ ] 1.3 Port interfaces, `@basalt/core/testing` in-memory file system and `describeWorkspaceFileSystemContract`
- [ ] 1.4 Note use cases and `isMarkdownPath`
- [ ] 1.5 Autosave state machine
- [ ] 1.6 Workspace watcher handling
- [ ] 1.7 Settings schema and parser for `basalt.json`

## Phase 2a: Platform and building blocks (PR 2)

Manual test checkpoint: the app still shows the welcome screen; Storybook/unit tests show the new `@basalt/ui` primitives; `npm run tauri dev` starts with the new plugins registered.

- [ ] 2a.1 Tauri plugins (`fs` with `watch`, `dialog`, `persisted-scope`), capabilities, platform spike
- [ ] 2a.2 Tauri adapters (`WorkspaceAccess`, `WorkspaceFileSystem`, `WorkspacePicker`, `AppSettingsStore`)
- [ ] 2a.3 Memory platform, `createPlatform()`, Playwright `webServer` env, production-bundle check
- [ ] 2a.4 `@basalt/editor` package (source mode)
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
