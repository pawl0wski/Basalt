---
date: 2026-11-08
slug: code-review-lesson8
type: analysis
status: final
tags: [code-review, autosave, tauri, capabilities, lockfile, e2e]
review-branch: session/9033e9-lesson8
base-branch: master
base-commit: fc25810
verdict: request-changes
---

# Code review — `session/9033e9-lesson8` vs `master`

Reviewed with the `om-code-review` skill (built-in checklist + repo rules: `AGENTS.md`, `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md`, `BACKWARD_COMPATIBILITY.md`, `.ai/specs/product-brief.md`, `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md`, `.ai/track.md`, `.ai/runs/2026-11-08-implement-markdown-notes-foundations.md`).

## Verdict: **REQUEST CHANGES**

Implement E01-S01 (Markdown notes + foundations). The diff is 188 files, +16 389 / −245: a new `@basalt/editor` package (CodeMirror 6), `@basalt/core` ports + note use cases + autosave + watcher + settings schema, a Tauri platform layer and an in-memory "memory platform" for Playwright, i18n, `@basalt/ui` TitleBar/ScrollArea/Alert extensions, custom window chrome, extensive Vitest (841) and Playwright (79) coverage, plus docs/spec/lesson updates. Quality of the code and of the test suite is genuinely high; the blockers below are integration-level gaps the run log itself partially acknowledges, not style complaints.

## Validation gate

| #   | Command                                 | Result                                                          |
| --- | --------------------------------------- | --------------------------------------------------------------- |
| 1   | `cd basalt-app && npm run format:check` | ✅ pass                                                         |
| 2   | `cd basalt-app && npm run lint`         | ✅ pass (0 warnings)                                            |
| 3   | `cd basalt-app && npm run typecheck`    | ✅ pass (all workspaces + `e2e` tsconfig)                       |
| 4   | `cd basalt-app && npm test`             | ✅ pass — 77 files, 841 tests                                   |
| 5   | `cd basalt-app && npm run build`        | ✅ pass — 983 kB chunk (gzip 326 kB), >500 kB warning           |
| 6   | `cd basalt-app && npm run rust:fmt`     | ⛔ **NOT RUN** — sandbox cargo 1.65 has no `rustfmt` subcommand |
| 7   | `cd basalt-app && npm run rust:lint`    | ⛔ **NOT RUN** — sandbox cargo 1.65 has no `clippy` subcommand  |

Commands 6–7 cannot run in this environment (toolchain lacks rustfmt/clippy); CI runs the same commands on a proper toolchain, so they must be green in CI before merge. An incomplete local gate means this review cannot approve regardless of other findings. Extra evidence: `npm run test:e2e` (not in the gate, run once locally): 78/79 pass, 1 failure — see minor finding m1. `npm run check:bundle` logic was reviewed but not executed.

## Blockers

### B1 — `src-tauri/Cargo.lock` was not updated for the three new Rust dependencies

**File:** `basalt-app/src-tauri/Cargo.toml` (+19-21), `basalt-app/src-tauri/Cargo.lock` (unchanged)
`tauri-plugin-fs` (feature `watch`), `tauri-plugin-dialog` and `tauri-plugin-persisted-scope` are added to `[dependencies]`, but `Cargo.lock` (last touched `41dab3f`) contains none of them. The committed lockfile no longer matches the manifest, so every local build silently rewrites it and reviewers can't see the resolved versions. `.ai/lessons/2026-11-08-tauri-fs-plugins-spike-setup.md` explicitly says "Cargo.lock was NOT updated … run `cargo update …` and commit the lock".
**Fix:** on a machine with a current Rust toolchain (CI's `node:22-alpine3.24` + rust or any local ≥1.65 with the crates), run `cargo check --manifest-path basalt-app/src-tauri/Cargo.toml` and commit the updated `Cargo.lock`. Also paste any `cargo clippy` output into the PR.

## Majors (MUST fix before merge unless a maintainer documents a waiver)

### M1 — fs scope is too narrow for the actual settings write path: app settings will not persist on desktop

**Files:** `basalt-app/src-tauri/capabilities/default.json:22-27`, `basalt-app/packages/app/src/platform/tauri/tauri-app-settings-store.ts:68-78`
The capability grants `fs:scope` allowing exactly one path: `{ "identifier": "fs:scope", "allow": [{ "path": "$APPCONFIG/basalt.json" }] }`. But `save()` calls `mkdir($APPCONFIG, { recursive: true })` and `writeFileAtomic(file, `${file}.tmp`, …)`. `basalt.json.tmp` and the `$APPCONFIG` directory are outside the scope, so on a real desktop both are denied; the whole `SettingsWriter.update` path (`settings-writer.ts:27-34`) swallows save failures (no `err`), so restoring the last workspace and per-workspace tabs would silently never persist. The lesson (`tauri-fs-plugins-spike-setup.md`, "Gotchas") flags exactly this and defers to a device spike — but the diff is what ships the capability.
Because Tauri can't be executed in this environment, this is filed as **major pending runtime confirmation**; treat as blocker if the first `tauri dev` confirms the refusal.
**Fix:** widen the allow list to the config directory and the temp pattern (e.g. `$APPCONFIG/*` or `$APPCONFIG/basalt.json*` plus the directory for `mkdir`), keep everything else out, and add a desktop step (or unit test with the generated permission schema) that asserts `settings.save` succeeds. Also decide whether `update()` should surface save failures instead of caching unsaved state (see m4).

### M2 — Save-mode ("Keep my version"/"Save again here") can be stolen by a concurrent autosave save

**File:** `basalt-app/packages/app/src/features/notes/notes-actions.ts:134-146, 288-298`
`saveWithMode()` publishes the `SaveMode` through the shared `nextSaveModes` map and any running/next save consumes it:

```ts
const mode = nextSaveModes.get(path) ?? "normal";
nextSaveModes.delete(path);
```

Race: while a debounced/leaving-tab `flush()` save is in flight (or launched concurrently with `forceSave()`), the in-flight save grabs the `overwrite`/`recreate` mode and deletes it. The subsequent `keepMine` save then runs in `"normal"` mode, `saveNote` re-reads the disk, sees `disk.text !== baseText`, returns `conflict`, and autosave pauses again — the user clicks "Keep my version" and the conflict banner silently stays. Two concurrent loops (a timer `flush()` and a `forceSave()`) can also both enter their `inflight = saveLatest()` chains, issuing overlapping saves of the same text.
**Fix:** bind the mode to the specific save call instead of module-level mutable state (e.g. store `{ mode }` with the queued next save inside `Autosave`, or add a `forceSave({ mode })` parameter to the core autosave), and make each autosave single-flight (return the running promise from `flush`/`forceSave` instead of launching a second chain). Add a regression test: conflict → "Keep my version" while a debounced save is in flight → file ends with the editor text and no conflict error.

### M3 — Autosave writes the file even when the note is clean

**File:** `basalt-app/packages/core/src/autosave.ts:119-128` (`forceSave`), `61-79` (`saveLatest`)
`forceSave()` calls `saveLatest()` unconditionally without checking `latestText === baseText`. Every Ctrl+S on an unedited note rewrites the file (same bytes, new mtime, fires a watcher event, and on disk would appear as externally modified). That contradicts the spec's autosave rule "Writes only when the note is dirty; opening or viewing a note never writes" (spec §Autosave, accepted rule; e2e only covers the dirty case).
**Fix:** in `forceSave()`, return early when `latestText === baseText` and no error is set; keep the error-then-retry behavior.

### M4 — `leaveActions.retry()` for `close-tab` ignores the second failure

**File:** `basalt-app/packages/app/src/features/leave/leave-actions.ts:49-58`
After a successful `notes.saveNow(pending.path)`, the code runs `await notes.closeTab(pending.path)` and discards the result, then `clear()`. If that second flush fails again (disk still read-only, folder gone), the Save-failed dialog closes while the tab stays open, dirty, with nothing visibly wrong except the in-editor banner.
**Fix:** capture the `closeTab` result; on failure re-`block(pending, error)` instead of `clear()` (or flush inside `closeTab` and report). Mirrors the `savings.spec.ts` expectation "Retry saves and closes the tab once the cause is fixed".

### M5 — Tauri-host behavior of the whole feature is unverified (fake-only evidence), manual desktop smoke test outstanding

**Files:** `basalt-app/packages/app/src/platform/tauri/**` (adapters verified only against `testing/fake-plugin-fs.ts`), `src-tauri/**`
Per the run log's own audit: no `cargo check`/`tauri build` ran anywhere yet (`Cargo.lock` not even updated), the capability JSON is unvalidated against a generated permission schema, and these runtime assumptions are unconfirmed: dialog `open` extending the fs scope, persisted-scope durability, symlink refusal via `lstat`, atomic rename semantics, recursive `watch` + the root-deletion event shape (root-lost detection depends on it), `onCloseRequested` async handler + `preventDefault` + `destroy`, the five derived `core:window:allow-*` identifiers, undecorated-window dragging/resizing on each OS. The spec's G6 decision (Playwright against the memory platform) covers e2e, but `BACKWARD_COMPATIBILITY.md`'s "Tauri host configuration" section requires permission changes to be spec/documented and validated, and the spec itself defers implementation status (`draft`) because of this.
**Fix (either):** run the manual desktop smoke test (Linux at minimum, Windows per CI matrix) on this branch and record results in the run log before merging to `master`; or obtain an explicit maintainer waiver noting the desktop path ships unverified.

## Minors (should fix)

- **m1 — e2e "a too-large note" is slow/flaky under load.** `e2e/editor.spec.ts:246-271` failed once with a 30 s timeout in a full local run (passed in 33 s isolated); it writes a 5 MiB buffer through the test handle plus base64 in `externalWrite`. Fix: seed the oversized file from `seedWorkspace` state (base64 precomputed with size) or raise this test's timeout and avoid the extra `waitForTimeout(1500)`.
- **m2 — note name strips `.md` case-insensitively… not.** `packages/core/src/notes.ts:57-63` (`toNote`) removes exactly 3 characters, so an externally created `Foo.MD` is listed as `Foo.` in the sidebar, while tab titles keep the real extension (`note-title.ts` regex is case-insensitive). Fix: `fileName.replace(/\.md$/i, "")`.
- **m3 — `suggestNoteName` can loop forever on an unsanitizable base name.** `packages/core/src/notes.ts:120-131`: if `baseName` contains a forbidden character (`:`, `\`…), every `toWorkspacePath(candidate)` fails and the `for(;;)` never terminates. Currently safe because `untitledName()` is `"Untitled"`, but any future translation with such punctuation hangs the UI. Fix: validate/sanitize `baseName` first or bound the loop.
- **m4 — settings skip is silent and the writer caches the skipped value.** `tauri-app-settings-store.ts:61-64` returns `ok(undefined)` when disk version is newer, but `settings-writer.ts:32-33` then caches the unsaved `next` — later reads see state that is not on disk and no signal exists. Prefer returning a typed error (e.g. `permission-denied`/`unavailable`) and don't cache on skip. The dedicated `settings-writer` unit test is still missing (acknowledged open item in the run log).
- **m5 — untranslated English defaults live in `@basalt/ui` presentational components.** `NoteSidebar.tsx` (`label = "Workspace"`, `newNoteLabel = "New note"`) and `TitleBar.tsx` (`"Window title bar"`, `"Open notes"`, `defaultWindowControlLabels`) hardcode English; the just-edited standards spec's Internationalization section says presentational components receive texts through typed props and containers translate. Consumers pass translations, so only defaults leak, plus `Show all open notes`/`Close {name}`/`not saved` inside TitleBar/NoteTab. Fix: require the props (remove English defaults) or record an owner-approved exception. Known open item (2b.2c/2b.2d).
- **m6 — open-error message conflates `invalid-path` causes.** `open-error-message.ts:6-7` maps any `invalid-path` open error to the symlink text; `notRegularFile()` in `notes.ts:82-87` also produces `invalid-path` for a directory, so a restored tab pointing at a now-directory path (or a non-regular entry) shows "This note is a symbolic link…". Fix: add a distinct code or a generic "not a regular file" message.
- **m7 — `createExclusive` cleanup on `unknown` can remove a file it didn't create.** `tauri-workspace-file-system.ts:128-139`: on any `unknown` failure it `remove`s the native path; with a misclassified error this could delete an entry another process just created after our `createNew` failed. Narrow the cleanup (e.g. only after verifying the file exists and was our own temp/timing) or cover it in the desktop smoke test.
- **m8 — external-change resolution gives up silently after 3 interleaved attempts.** `notes-actions.ts:306-354` retries when the session mutated during the async read but after 3 attempts performs no final resolution and reports nothing. An external change can go unnoticed with neither banner nor sync state. Fix: after the loop, run one final `resolveOpenNoteChange` against the latest state or at least record the unresolved change.
- **m9 — tracker/documentation inconsistency.** `.ai/track.md` row 2b.4 is unchecked while the run log says 2b.4 (README/lessons/run log/spec extraction) was completed; the main spec stays `draft` (intended, desktop unverified) but the tracker row should match reality before this merges.

## Touched contracts / material consequences

- `BACKWARD_COMPATIBILITY.md` — "Public exports of workspace packages": `NoteSidebar` lost `onChangeWorkspace`, `TitleBar`/`NoteTab` props became optional/extended; all consumers were updated in the same diff and typecheck is green — compliant (private packages, update-in-same-PR rule).
- "Tauri host configuration": plugin set + permission widening (fs/dialog/persisted-scope/window controls/`decorations: false`) is spec + lesson documented, but validation of the generated schema/runtime is still outstanding → covered by **M1/M5**.
- Product-brief gate: no Non-goal (N01–N03), Business rule or Decision is contradicted by this diff; no superseding-entry issue.
- Workspace-on-disk rule ("nothing but notes written into the workspace") is respected: per-device state goes to `$APPCONFIG/basalt.json`; `.basalt/` is not created; release for atomic writes leaves only a temp dotfile transiently.
- Bundle hygiene: memory platform is env-selected with a dual-build `check:bundle` (reviewed; not executed here) — a strong guard, and the CI workflow now runs it.

## Notable positives (keep)

- Contract-test suite (`@basalt/core/testing`) that both adapters run; fake-plugin-fs for adapter units; exact-bytes E2E round-trips (CRLF+BOM, untouched-note-never-rewritten, per-workspace tab restore).
- `AppError` code discipline with an i18n test that fails when an error code lacks user text; typed i18n keys verified to fail `typecheck`.
- Self-documenting lessons and run log that honestly label the UNVERIFIED surface — this review's majors are largely those items promoted into the diff review.

## Recommended fix order for the resolving agent

1. **B1** (commit updated `Cargo.lock`; needs a Rust toolchain — otherwise ask CI to attach the diff of the regenerated lock).
2. **M1** (widen `fs:scope` for `$APPCONFIG` + temp pattern; add the desktop verification note).
3. **M2 + M3** (autosave single-flight, mode ownership, clean-note no-op; add conflict-keeping regression test).
4. **M4** (re-block on second close failure).
5. **M5** (desktop smoke test or documented waiver).
6. Minors m1–m9 (m2/m3/m4 are small core/store changes; m1 touches only e2e).

_Report generated by the `om-code-review` skill on 2026-11-08; validation tables and findings reflect the branch at commit `5166757`._
