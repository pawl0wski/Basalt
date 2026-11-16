---
date: 2026-11-16
slug: fix-workspace-scope-and-image-drop
type: spec
status: implemented
tags: [bug, images, tauri, fs-scope, editor, windows]
---

# Fix: images cannot be added on Windows (non-recursive workspace scope) and the drop area is too small

## 📝 TLDR

On the built Tauri app (reproduced on Windows), adding an image by drop or paste (E01-S03, #10) always fails with the notice "The workspace folder is read-only. Nothing was changed." The folder is writable. The real cause is that the workspace picker grants a **non-recursive** fs scope. Because of this, `tauri-plugin-fs` rejects every path below a sub-folder (`attachments/…`) with `forbidden path`, and the app reports that as read-only. The same narrow scope also breaks displaying images already stored in `attachments/`. Separately, a drop only works over the lines of text, because the editor is only as tall as its content.

This spec describes the future behavior:
- the picker grants a recursive scope;
- workspaces picked before the fix are recovered with a single "Grant access" action that keeps the open notes;
- scope errors are reported truthfully;
- the whole editor pane accepts drops.

## 📝 Problem Statement

Evidence (owner's manual test, Windows, `npm run tauri dev`, 2026-11-16):

| Observation | Meaning |
| --- | --- |
| Notes in the workspace root are created and saved | Root and its direct children are in scope |
| `attachments/` is created when an image is dropped | `mkdir` of a direct child is in scope |
| `plugin:fs\|read_dir` and `plugin:fs\|write_file` on `<root>\attachments\…` → `forbidden path: …, maybe it is not allowed on the scope for allow-read-dir / allow-write-file` | Grandchildren of the root are **not** in scope |
| Notice "The workspace folder is read-only" | `mapPluginError` maps `forbidden path` to `permission-denied`, whose text says "read-only" |
| Dragging a file over the empty part of a short note shows the 🚫 cursor | The window drop guard (`dropEffect = "none"`) handles the drop, not the editor |

Root causes:

1. **Non-recursive scope.** `basalt-app/packages/app/src/platform/tauri/tauri-workspace-picker.ts` calls `open({ directory: true, multiple: false })`. Without `recursive: true`, `tauri-plugin-dialog` adds only the folder and its direct children to the fs scope. `tauri-plugin-persisted-scope` then stores that narrow scope, so restarting does not help.
2. **Misleading error.** In `basalt-app/packages/app/src/platform/tauri/plugin-errors.ts`, the `PERMISSION_DENIED` regex contains `forbidden path|not allowed on the`. So OS access denial and plugin scope denial share one `permission-denied` code.
3. **Small drop target.** Nothing gives `.cm-editor` the pane height (`packages/editor/src/theme.ts` and the note editor container), so an empty or short note is a one-line drop target.

Impact:
- Every operation below a sub-folder fails: adding an image (`read_dir`, `write_file` in `attachments/`), and displaying an existing image (`readFile` in `tauri-workspace-file-system.ts`, shown as the "unreadable" placeholder).
- Any future note in a sub-folder (E01-S04) would fail the same way.
- Tests did not catch it, because the memory platform has no scope. The lesson `2026-11-16-paste-drop-e2e-and-alert` had already flagged plugin-fs on real Tauri as unverified.

## 📝 Proposed Solution

1. **Recursive scope on pick.** `open({ directory: true, multiple: false, recursive: true })`. Persisted-scope then stores the recursive grant.
2. **Separate error code.** Add the app error code `scope-denied`. `mapPluginError` tests `SCOPE_DENIED = /forbidden path|not allowed on the scope/i` **first**, before `NOT_FOUND` and all other patterns, because the plugin message embeds the full path, which may contain words the other patterns match. `forbidden path|not allowed on the` is removed from `PERMISSION_DENIED`.
3. **One workspace-level "access needed" state, not per-feature handling.** In `enter()`, the workspace's `WorkspaceFileSystem` is wrapped in a decorator. When any operation returns `scope-denied`, the decorator reports it, and workspace actions set `accessNeeded: true` in the workspace store. The pattern is the same as the existing `unavailable` flag and `handleWorkspaceLost`. Everything that goes through the workspace fs is covered without feature-specific code: saving notes, listing, adding images and loading images.
4. **Access banner with "Grant access".** While `accessNeeded` is true, the editor area shows a `WorkspaceAccessBanner` next to `WorkspaceUnavailableBanner` in `NoteEditorAreaContainer.tsx`. It has the title "Basalt needs access to the whole workspace folder", a short message asking the owner to select the same folder again, and two actions: "Grant access" and "Change workspace". "Grant access" calls a new `workspaceActions.regrantAccess()`:
   - It calls `picker.pickDirectory({ defaultPath: root })`. The plugin-dialog grants the recursive scope as soon as the folder is picked, so **the existing fs adapter works without reopening the workspace**.
   - Same folder (see path comparison below): set `accessNeeded: false`, then refresh the note list and reload images (`notes.refreshNotes()`, image cache refresh). Open tabs, sessions, unsaved text and the watcher stay untouched. Notes whose save failed keep their existing retry flow.
   - Different folder: the existing switch flow `openRoot(picked, "open", false)` (flush, held/discard dialog, `enter`).
   - Cancelled: nothing changes, the banner stays.
5. **Path comparison.** A pure function `sameWorkspaceRoot(a, b)` in `@basalt/core` compares paths after a textual normalization:
   - strip a leading `\\?\` prefix;
   - convert `\` to `/`;
   - drop a trailing separator, except on a drive or filesystem root.

   The comparison is case-sensitive on purpose. On Windows, a case-only difference then falls back to a full reopen, which is correct but heavier. A case-insensitive comparison on Linux could treat two different folders as one and skip a reopen that is needed. No OS detection and no new dependency are needed.
6. **Truthful messages.** `errors.permission-denied` keeps "The workspace folder is read-only. Nothing was changed." The new `errors.scope-denied` says "Basalt does not have access to this part of the workspace folder. Nothing was changed." Both the add-image notice (`add-notice.ts`, through `errors.${reason}`) and the generic save `ErrorBanner` (`NoteEditorAreaContainer.tsx`, through `errors.${code}`) pick it up automatically. The action lives only on the workspace banner, so `AddNotice` and the save banner need no button.
7. **Startup restore.** If `restoreWorkspace` gets `scope-denied` from `access.open`, the welcome screen shows a new `WorkspaceNotice` value `workspace-access-needed`, with the text "Open the workspace folder again to give Basalt access to it." The existing "Open folder" button then grants the recursive scope. This does not happen with today's flat workspaces (the root is in scope), but it will once notes live in sub-folders (E01-S04).
8. **Whole-pane drop target.**
   - The note editor container is a flex column. Notices and banners take their natural height, and the editor wrapper uses `flex: 1; min-height: 0`.
   - `.cm-editor` gets `height: 100%`, `.cm-scroller` gets `overflow: auto`, and `.cm-content` gets `min-height: 100%`. The editor scrolls inside `.cm-scroller`, not in the pane.
   - A drop or click below the last line lands in the editor. A drop below the text inserts the link at the end of the document (`fileInput.ts` uses `posAtCoords`, which clamps to the nearest position).
   - The window drop guard stays for the sidebar and tab bar. Dropping anywhere in the window stays out of scope (archived draft `archive/2026-11-16-drop-images-anywhere-in-window.md`).

### Alternatives rejected

- Widen the scope in a custom Rust command at startup (`FsExt::allow_directory(root, true)`). This would work silently, but it adds custom Rust (against `src-tauri/AGENTS.md`) and grants access without a user gesture.
- A static `fs:scope` with `$HOME/**`. Far too broad for an E2EE notes app.
- Reopening the workspace after a same-folder re-grant. It is not needed for the scope, and `enter()` calls `notes.leaveWorkspace()`, which would close the owner's tabs and could trigger the flush/discard dialog.
- A "Grant access" button on each feature notice (add-image notice, save banner, image placeholder). It duplicates the action in three places and misses failures without a notice, such as image loading.

## 📝 Decisions

- An image whose add failed is **not** retried automatically after "Grant access". The owner drops or pastes it again. The add-image notice says what failed, and the drop payload is not kept.
- Existing images that failed with `scope-denied` show the "unreadable" placeholder until access is granted. After that they are reloaded. The placeholder gets no extra text, because the workspace banner explains the cause.
- `accessNeeded` and `unavailable` are independent flags. When both are set, `unavailable` wins (the folder is gone, so granting access is meaningless) and only `WorkspaceUnavailableBanner` is shown.

## 📝 Architecture

- `@basalt/core`:
  - `APP_ERROR_CODES` gains `scope-denied`. Exhaustive switches (`image-source.ts` → `unreadable`, `open-error-message`) and the i18n completeness test (`i18n.test.ts`) force the new handling.
  - `WorkspacePicker.pickDirectory(options?: { defaultPath?: WorkspaceRoot })`.
  - New pure function `sameWorkspaceRoot`.
- `@basalt/app` `platform/tauri`: the picker passes `recursive: true` and `defaultPath`, and `mapPluginError` gets the new first pattern. The memory platform ignores `defaultPath`.
- `@basalt/app` `platform/memory`: `BasaltTestFs` gains `setScopeDenied(prefix: string | null)`. Every operation on a path under `prefix` fails with `scope-denied`, and the next `pickDirectory` result clears it (simulating the grant).
- `@basalt/app` `features/workspace`:
  - the scope-reporting fs decorator;
  - `accessNeeded` in the workspace store;
  - `regrantAccess()`;
  - the `workspace-access-needed` notice.
- `@basalt/app` `features/editor`: `WorkspaceAccessBanner` (in `NoteBanners.tsx`, built on `ActionBanner`), the flex-column layout, and the i18n keys.
- `@basalt/editor`: full-height theme rules.
- No change to `tauri.conf.json`, capabilities, Rust, `@basalt/ui` or the on-disk workspace format. The `BACKWARD_COMPATIBILITY.md` surfaces are untouched. `AppErrorCode` is internal and never persisted.

## 📝 Edge Cases & Failure Scenarios

| Case | Behavior |
| --- | --- |
| Workspace picked before the fix, first image add | Add-image notice with the `scope-denied` reason. The workspace banner appears. After "Grant access" with the same folder, the banner goes away, and the next drop works without restarting or losing tabs |
| Workspace picked before the fix, note with an existing image | "Unreadable" placeholder and the workspace banner. After the grant, the image is shown |
| Saving a note fails with `scope-denied` (sub-folder notes, E01-S04) | Save `ErrorBanner` with the `scope-denied` text, plus the workspace banner. Text is kept, and after the grant the existing retry saves it |
| Owner picks a different folder in the re-grant dialog | Existing switch flow (flush, discard dialog if blocked) |
| Owner cancels the re-grant dialog | Banner stays, nothing changes |
| Same folder, path differs only by trailing separator or `\\?\` prefix | Treated as the same folder |
| Same folder, path differs only by letter case (Windows) | Full reopen through the switch flow. The scope is granted either way |
| Folder really read-only (OS ACL) | Unchanged "read-only" text (`permission-denied`), no workspace banner |
| Path contains words such as "not found" or "os error 2" | Still `scope-denied`, because the scope pattern is tested first |
| Unknown future plugin wording | Falls back to the existing mapping. The regex is covered by tests with the exact Windows and Linux messages from `tauri-plugin-fs` 2.x |
| Startup with a narrow scope that blocks the root listing | Welcome screen with the `workspace-access-needed` notice |
| Folder disappears while access is needed | Only the unavailable banner is shown |
| Empty note, drop anywhere in the pane | Link inserted at the start of the note, image preview shown |
| Long note | Editor scrolls inside `.cm-scroller`, no double scrollbar, banners stay visible |
| Drop on sidebar or tabs | Still ignored, no navigation (window guard) |

## 📝 Risks & Impact Review

- The Linux and macOS wording of the scope error is assumed to match the Windows one (`forbidden path`). It comes from plugin-fs itself (`@tauri-apps/plugin-fs ^2.7.1`, Rust `tauri-plugin-fs` 2), not from the OS, so it should be the same. Verify manually on Linux. A plugin update that changes the wording silently degrades to the old mapping, so the regex tests name the plugin version.
- Persisted-scope keeps old narrow grants. Users of builds made before the fix must re-grant once. This is acceptable because the app is pre-release and built for the owner first (D02).
- Whether the decorator covers everything depends on all workspace I/O going through the `WorkspaceFileSystem` passed to `enter()`. The settings store uses its own `$APPCONFIG` scope and is deliberately not wrapped.

## 📋 Implementation Plan

**Phase 1: scope fix (unblocks images)**

1. Picker passes `recursive: true` and the optional `defaultPath`. Unit tests: `open` is called with `recursive: true`, and with `defaultPath` when it is given.
2. `scope-denied` code and mapping, with the pattern tested first and removed from `PERMISSION_DENIED`. Unit tests:
   - the exact message `forbidden path: C:\…\attachments, maybe it is not allowed on the scope for \`allow-read-dir\` …` → `scope-denied`;
   - the Linux variant with a `/home/…` path → `scope-denied`;
   - a forbidden path that contains `not found` → `scope-denied`;
   - `Access is denied. (os error 5)` → `permission-denied`.
3. `sameWorkspaceRoot` with unit tests for the prefix, separators, trailing separator, drive root and case difference.
4. Scope-reporting decorator and `accessNeeded` state. Unit tests: a `scope-denied` result from any method sets the flag, other errors and successes do not, and results pass through unchanged.
5. `regrantAccess()`. Unit tests:
   - same folder: flag cleared, notes refreshed, sessions kept, `enter` not called;
   - different folder: switch flow;
   - cancel: nothing changes;
   - picker error: error stored, flag kept.
6. `WorkspaceAccessBanner`, `errors.scope-denied` and the `workspace-access-needed` notice (i18n). Unit tests for the banner actions, the add-image notice text and the "unavailable wins" rule.
7. Playwright on the memory platform, using `setScopeDenied("attachments")`:
   - drop an image: the notice and the banner are shown;
   - "Grant access" with the same folder: the open tab and typed text are still there;
   - drop again: the image file is written.
8. Manual check on the built Windows app (and Linux): pick a workspace, drop an image into `attachments/`, restart, drop again. Also check the re-grant flow with a scope persisted by a build made before the fix. Record a lesson.

**Phase 2: full-pane drop target**

9. Full-height editor layout. Playwright:
   - in an empty note, dispatch a `drop` well below the first line inside the editor pane: the link is inserted and the image file is written;
   - in a long note: the pane does not scroll, `.cm-scroller` does.

   Existing `add-images.spec.ts` tests still pass. Run `npm run check:tokens`.
10. Update the lesson `2026-11-16-paste-drop-e2e-and-alert` (plugin-fs on real Tauri now verified) and write the run log.
