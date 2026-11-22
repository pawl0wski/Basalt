---
date: 2026-11-17
slug: status-bar-word-count
type: spec
status: implemented
tags: [status-bar, word-count, save-state, e01]
---

# The status bar shows word count instead of the save state (E01-S07)

Prototype: `prototypes/workspace-basic/` (screen map: `prototypes/e01-screen-map.md`). The prototype's status bar still shows the save state only and is not updated (it is a design artifact); screen ids (s02, s03, s05) refer to that map.

Source issue: #36 (E01-S07, epic #5). Depends on: #8 (E01-S01, foundations). Builds on `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (the "S01 spec"; AC-01.11 and AC-01.19 are refined here). Related specs in this PR (#42): `.ai/specs/2026-11-16-rename-move-delete-folders.md` (E01-S05) and `.ai/specs/2026-11-16-note-name-follows-first-heading.md` (E01-S06). E02 (#6) will use the status bar for the server sync state. Design authority: `.ai/specs/product-brief.md`. Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec").

## 📝 TLDR

The owner (the only confirmed user, D02) tested E01 and reported that the bottom-right status bar duplicates the unsaved state the tab dot already shows, while the bar is the place E02 needs for sync (issue #36, 2026-11-16). This change removes "Saved" / "Saving…" / "Not saved" from the status bar, keeps the tab dot and its accessible name as the unsaved state, and shows the active note's word count at the trailing end of the bar. The E02 sync state will share that end. Save failures, conflicts and paused autosave keep their persistent banners and dialogs.

## 📝 Decisions (owner)

| Id  | Topic      | Decision                                                                                                                                                     |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-1 | Tab dot    | The dot on the note tab stays as the unsaved indicator; the status bar's save-state text ("Saved" / "Saving…" / "Not saved") is removed (owner, 2026-11-16). |
| D-2 | Word count | The status bar shows the active note's word count; the owner welcomes it (owner, 2026-11-16).                                                                |
| D-4 | Placement  | The prototype variant B won: the word count sits at the trailing end of the bar, leading is empty, words only, no characters (owner, 2026-11-22).            |
| D-5 | Markers    | Bare Markdown markers are never words: only whitespace tokens containing a letter or a digit count (owner, 2026-11-22).                                      |
| D-3 | E02 sync   | E02 will use the status bar for the server sync state; the trailing slot is kept for it and no placeholder sync word is added now (owner, 2026-11-16).       |

## 📝 Acceptance criteria

The issue's five criteria are refined below; the derived ones make the decisions and the accessibility rule explicit. Screen ids refer to the screen map.

| Id      | Criterion                                                                                                                                                                                                                                                                      | Screen   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| AC-07.1 | Given an open note, when the owner types, then the status bar shows the note's word count ("1,204 words", thousands separators) and it follows the editor text on every change.                                                                                                | s03      |
| AC-07.2 | Given a note with unsaved text, then only the tab dot indicates it; the status bar shows no save-state wording.                                                                                                                                                                | s03      |
| AC-07.3 | Given no open note, then the status bar shows no count and no save state; the bar stays in place. A note that failed to open shows no count either.                                                                                                                            | s02, s03 |
| AC-07.4 | Given a failed save, a conflict or a deleted file, then the persistent banner or dialog still explains the failure with its actions; the status bar does not.                                                                                                                  | s03, s05 |
| AC-07.5 | Given pending or paused autosave, then the unsaved state stays discoverable through the tab dot and the tab's accessible name ("not saved"), with no save-state wording in the status bar.                                                                                     | s03      |
| AC-07.6 | Given an empty or whitespace-only note, then the count is "0 words"; a token counts as a word only when it contains a letter or a digit, so bare Markdown markers (`#`, `-`, `>`, `---`) are not words (a note created with `# ` shows "0 words"; `# Heading` shows "1 word"). | s03      |
| AC-07.7 | The status bar shows the count at the trailing end (leading is empty, owner D-4); the E02 sync state will share that end; no sync word appears in E01.                                                                                                                         | s03      |
| AC-07.8 | The count is plain text, not a live region; the tab dot stays decorative (`aria-hidden`) with the state in the tab's accessible name; the save-failure banner stays `role="alert"`.                                                                                            | s03      |

## 📝 Not doing

- **Character count.** The `characterCount` prop stays on `StatusBar`, but the app does not pass it; adding it later is additive (the issue's out of scope).
- **Reading statistics.** Reading time, selection counts and per-heading counts are out of scope (the issue).
- **A settings toggle for the count.** No settings screen exists in E01 (S01 Out of scope); the design-system note about turning counts off is a proposal.
- **The E02 sync indicator itself.** D-3; E02 owns it.
- **Removing `SaveStatus` or the `StatusBar.saveState` prop.** No product value now; the DetailView pattern story uses `SaveStatus`. A later cleanup can remove them.
- **Debouncing the count.** It updates per keystroke; the cost is documented in Risks.
- **A live region for the count.** It changes on every keystroke and must not be announced constantly (AC-07.8).
- **A Markdown-aware count** (stripping syntax, counting CJK characters individually). Tokens are counted as they are split on whitespace, except that marker-only tokens are skipped (D-5); the difference is documented in Edge cases.
- **Localizing the count wording.** English only (G10); `StatusBar` keeps its English defaults, as today.
- **Updating the clickable prototype.** It is a design artifact; its status bar keeps the save state and shows no counts.

## 📝 Problem statement

- The owner tested epic E01 and reported the duplication (owner feedback, 2026-11-16, issue #36): the tab dot already marks an unsaved note, and the bottom-right status bar repeats it in words — AC-01.11 ("The status bar shows only the save state (Saved / Saving… / Not saved). There is no sync word.") and AC-01.19 ("Pending and paused autosave both show \"Not saved\". No other save-state wording exists.").
- The cost today: two indicators for one state; no live count while writing; the bar's trailing area is spoken for by the save word that E02 needs for sync. Obsidian shows the word count there.
- Who: the owner, the only confirmed user (D02). No other user is confirmed.

## 📝 Proposed solution

Move the status bar to the Obsidian split — count and sync state at the trailing end, save state on the tab:

1. **Core.** A pure `countWords` helper counts whitespace-separated tokens that contain a Unicode letter or number.
2. **App.** The status-bar container derives the count from the active session's text and passes `wordCount`; the save-state rendering and its `save-state.ts` mapping are removed. The tab dot and the tab's accessible name stay as they are.
3. **UI.** `StatusBar` is used with its `trailing` slot only (the count); the leading slot stays empty; stories and docs are updated to the product usage.
4. **Rust.** No change.

Prior art: Obsidian shows the word count at the bottom-left of the status bar and updates it live, keeps the unsaved state on the tab and the sync state at the bottom-right; VS Code shows the word count on demand. This spec takes the Obsidian split and skips the parts Basalt does not need (character count, reading time, selection counts).

Alternatives considered and rejected:

- **Keep the save state and add the count.** The issue and the owner decision remove the duplication; the tab dot already carries the state (D-1).
- **Word and character count.** The issue's AC names the word count and character count is explicitly conditional; word-only is the smallest scope and adding characters later is additive.
- **A debounced count.** New state and timers for no visible benefit at typical note sizes; the count is a pure function of text that already changes per keystroke.
- **A Markdown-aware count.** Obsidian counts the raw text tokens; stripping syntax or counting CJK per character is a bigger scope with no AC.
- **Removing `SaveStatus` and the `saveState` prop.** A breaking change to a public export with no product value; the DetailView pattern story still uses `SaveStatus`.
- **A settings toggle.** No settings screen in E01.

## 📝 Architecture

- **`@basalt/core`.** New pure module `text-stats.ts`: `countWords(text)`; exported from `packages/core/src/index.ts`. It is domain text logic, not UI logic, so it lives in `core` next to the other pure helpers; no dependencies, no Markdown parsing. (The prototype has its own `countWords` in `prototypes/workspace-basic/src/model/markdown.ts`; the product helper is independent.)
- **`@basalt/app`.** `features/status/AppStatusBarContainer.tsx` selects the active session (`openNotes.find((note) => note.path === state.activeNote)`) and passes `wordCount` — `countWords(active.text)` when the session exists and did not fail to open, else `null` — and formats it with the app’s English translation keys. `features/status/AppStatusBar.tsx` renders the count in the `StatusBar` trailing slot; its `saveState`/`labels` props go away, and it stays presentational (props only, no store access), matching the container/presentational split of the standards spec. `features/status/save-state.ts` and `save-state.test.ts` are deleted (their only consumer was the status bar). `features/notes/notes-store.ts` is unchanged: `NoteSession.text` is the count's source and `isDirty` still drives the tab dot. `features/editor/useNoteTabs.ts` is unchanged: the tab already carries `unsaved` and `NoteTab` renders the dot plus the `sr-only` "not saved" text. The `saveStatus.*` keys are removed from `i18n/locales/en.json`.
- **`@basalt/ui`.** `StatusBar` and `SaveStatus` keep their prop surfaces (no breaking export change); the app stops passing `saveState`. The E01 guide, design-system documentation and screen stories describe the word count and the tab’s unsaved indicator.
- **`src-tauri`.** No change: no new command, permission, plugin or dependency.

## 📝 Data model

No new entities and no persisted-format change: the count is derived in memory from the session text, nothing is written, and `basalt.json` is unchanged (`BACKWARD_COMPATIBILITY.md` "Workspace on disk" is untouched). `NoteSession` keeps its fields; no new store state. The count is never persisted and never logged. No data-model graph: this section adds or changes no entities.

## 📝 API contracts

```ts
// @basalt/core — text-stats.ts (new; exported from the package entry)
export function countWords(text: string): number;

// @basalt/app — features/status/AppStatusBar.tsx
export type AppStatusBarProps = {
  wordCount: number | null;
  formatWordCount: (count: number) => string;
};
```

Rules:

- `countWords` counts each whitespace-delimited token containing a Unicode letter or number. The scan matches the first letter or number and consumes the rest of that token (`/[\p{L}\p{N}]\S*/gu`). Empty, whitespace-only and marker-only text is `0`. Bare markers (`#`, `-`, `>`, `---`, `|`) are not words, a token with inline markers (`**bold**`) counts once (`# Heading` is one word). No Markdown parsing, no CJK special-casing.
- `AppStatusBar` renders the formatted count in `StatusBar`'s `trailing` slot (the container formats it with the `statusBar.wordsOne` / `statusBar.wordsMany` i18n keys); `null` (no note, or a note that failed to open) renders the bar with no count.
- `StatusBar`'s `wordCount`, `characterCount`, `saveState` and `trailing` props are unchanged — no breaking change to a `@basalt/ui` export.
- Removed: `save-state.ts` (`toSaveState`) and the `saveStatus.*` i18n keys; both have no consumers after the change.

## 📝 UI/UX

- **Status bar (s03).** The trailing slot shows "1,204 words" (`text-muted`, `text-size-ui-small`, thousands separators); the leading slot is empty; no save-state word appears anywhere in the bar.
- **Tab (s03).** The dot stays on a dirty tab; the tab's accessible name carries "not saved" (existing `sr-only` text in `NoteTab`); the dot stays `aria-hidden`.
- **No note (s02, s03).** The bar renders empty — no count, no save state — and stays in place so the shell does not move.
- **Failed open (s03).** No count (there is no text); the open-error message stays in the editor area.
- **Banners and dialogs (s03, s05).** Unchanged: save failure, conflict, deleted file and paused autosave keep their persistent banner or dialog with actions.
- **Accessibility.** The count is plain text, not a live region (no per-keystroke announcements); the save-failure banner stays `role="alert"`; the tab name is the accessible unsaved state.
- **i18n.** `saveStatus.*` is removed; the app formats the count with the English `statusBar.wordsOne` and `statusBar.wordsMany` keys.

Prototype: `prototypes/workspace-basic/` (screen map `prototypes/e01-screen-map.md`; screens s02, s03, s05); not updated.

## 📝 Edge cases & failure scenarios

| Scenario                                                   | Behaviour                                                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| No note open                                               | The bar is empty: no count, no save state.                                                               |
| Active note failed to open (too large, not UTF-8, symlink) | No count; the open-error message stays in the editor area.                                               |
| Empty note                                                 | "0 words" (the actual count).                                                                            |
| Whitespace-only note                                       | "0 words".                                                                                               |
| New note created with `# ` (S06)                           | "0 words" until the owner types a word; the marker is not a word.                                        |
| Markdown syntax in the text                                | Bare marker tokens are not words (`# Heading` is one word); a token with letters or digits counts once.  |
| Typing during a save                                       | The count follows the editor text; it does not wait for the save.                                        |
| Pending or paused autosave                                 | The count still shows; the tab dot and the accessible name carry the unsaved state; no save wording.     |
| Save failure, conflict or deleted file                     | The persistent banner or dialog stays; the bar shows the count only.                                     |
| Read-only workspace                                        | The count still shows (reading works); the banner explains a failed save.                                |
| Switching tabs                                             | The count follows the active tab.                                                                        |
| Another tab is dirty, the active one is clean              | The bar shows the active note's count; the dirty tab keeps its dot and accessible name.                  |
| Autosave paused behind a banner and the owner types more   | The count keeps following the editor text; the banner stays.                                             |
| Clean note reloaded after an external change               | The count updates to the disk text.                                                                      |
| Note deleted externally while open                         | The deleted banner stays; the count still reflects the kept session text.                                |
| Very large note (5 MiB)                                    | The count is O(n) per change; a known cost, a debounce or incremental counting is the fallback.          |
| Thousands of words                                         | "1,204 words" (English separators, existing `StatusBar` behaviour).                                      |
| CRLF or BOM file                                           | The session text is normalized to LF on open; the count is unaffected.                                   |
| CJK text                                                   | Whitespace tokens only; CJK characters are not counted individually (unlike Obsidian). Documented limit. |
| Note with a save error but text kept                       | The count still shows; the banner keeps the actions.                                                     |
| Note renamed or moved while open (S04, S06)                | The count is unaffected; the tab and the tree follow the new path.                                       |
| Workspace changed                                          | The bar empties until a note in the new workspace is opened.                                             |

## 📝 Risks & impact review

- **Hard to reverse:** none new. No persisted format, no Tauri permission, no dependency; `BACKWARD_COMPATIBILITY.md` protected surfaces are untouched (`StatusBar`/`SaveStatus` exports unchanged; the app's i18n keys are internal).
- **The worded save state disappears from the bar**, including the polite `role="status"` announcement of "Saved". The tab dot and its accessible name remain, and failures still announce (`role="alert"`). This is the issue's deliberate trade-off (AC-07.2, AC-07.5).
- **Per-keystroke count on a 5 MiB note is O(n)**; typical notes are small. A debounce or incremental counting is the fallback if it becomes a problem.
- **Market check (general knowledge, not freshly verified).** Obsidian shows word and character counts at the bottom-left of the status bar and updates them live; its save state is not a word — a dot on the tab marks an unsaved note and the title bar reflects it; Obsidian Sync shows a word or icon at the bottom-right, the slot E02 will use. VS Code shows caret and selection in the status bar and word count on demand; Notion and Google Docs show a transient "Saving…"/"Saved" near the title, not a persistent word. This spec takes Obsidian's split (count and sync state at the trailing end, save state on the tab) and skips character count, reading time and CJK-per-character counting for now.
- **AC-01.11 and AC-01.19 are refined**; the S01 spec rows are updated in place (the issue's requirement), and the S01 "Out of scope" line that excluded word counts is superseded for the word count by the owner decision of 2026-11-16. S01 stays implemented otherwise.
- **Public exports:** `@basalt/core` gains `countWords` (additive); `@basalt/ui` is unchanged; the app's internal `AppStatusBar` props change. No consumer outside this monorepo exists.
- **Tests updated:** `AppStatusBar.test.tsx` (rewritten), `save-state.test.ts` (deleted), `AppSaving.test.tsx`, `ExternalChanges.test.tsx`, `WorkspaceLost.test.tsx`, `i18n.test.ts`, and the e2e specs `saving.spec.ts`, `notes-roundtrip.spec.ts`, `external-changes.spec.ts`; a new `status-bar.spec.ts`. The e2e memory platform proves app behavior, not real-disk behavior (the S01 limit is unchanged).
- **What tests can and cannot prove.** Playwright asserts the count from the editor text on the memory platform; the real-disk path is not exercised.

## 📝 Decisions in play

- **D02** (built for the owner first) — justifies the simple whitespace rule and no settings toggle.
- **D05** (MVP includes Markdown notes) — the count is part of the note experience; no scope change.
- The owner decision of 2026-11-16 (issue #36) refines AC-01.11 and AC-01.19 and supersedes the S01 "Out of scope" line for the word count; recorded as D-1–D-3 above.
- **E02** (#6) will use the status bar for the server sync state (the issue's "Decisions in play"); this spec keeps the trailing slot for it.
- Nothing else proposed supersedes an active product-brief entry.

## Resolved assumptions (autonomous defaults)

| Id  | Question                                                                                    | Chosen answer                                                                                                                   | Rationale                                                                                                          |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Q1  | Word count only, or word and character count as Obsidian offers?                            | Word count only; `StatusBar` keeps `characterCount` but the app does not pass it.                                               | The issue's AC names the word count; character count is explicitly conditional; adding it later is additive.       |
| Q2  | Does the count update on every keystroke or after a debounce?                               | Per keystroke, derived from the active session's text.                                                                          | No new state or timers; matches Obsidian; the count is a pure function of text that already changes per keystroke. |
| Q3  | What does the status bar show when no note is open?                                         | The bar renders empty: no count, no save state; the bar stays.                                                                  | The issue's AC; "0 words" with no note would be an invented count.                                                 |
| Q4  | Should the tab dot get an accessible label in addition to its visual state?                 | None added; the dot stays `aria-hidden` and the tab's accessible name already carries "not saved" (`NoteTab`'s `sr-only` text). | Avoids double announcement; the accessible state already exists and the tests assert it.                           |
| Q5  | Does the E02 sync indicator replace the trailing slot entirely, or share it with the count? | Superseded by D-4: the count uses the trailing slot (prototype variant B); E02 decides replace-or-share in its own spec.        | The issue keeps the slot for E02; nothing here blocks either E02 choice.                                           |
| Q6  | Keep or remove `SaveStatus` and the `StatusBar.saveState` prop?                             | Keep both in `@basalt/ui`; the app stops using them.                                                                            | No breaking change to a public export; the DetailView pattern story uses `SaveStatus`.                             |

## 📋 Phasing

1. **PR A, core.** `text-stats.ts` with `countWords`, exported from the package entry, unit tests. No visible change.
2. **PR B, the status bar.** App wiring, the removal of the save-state rendering and mapping, the i18n cleanup, the `@basalt/ui` stories and docs, the unit-test updates, the e2e updates and the new `status-bar.spec.ts`, and the AC-01.11/AC-01.19 spec update.

Closes #36 on PR B only.

## 📋 Implementation plan

Each step is testable and leaves the application working. Vitest next to the code, Playwright in `basalt-app/e2e/`, and the validation gate from `SDLC.md`.

**Phase A — core (PR A)**

1. `countWords` in `text-stats.ts`: scan whitespace-delimited tokens containing a letter or number, 0 for empty and whitespace-only; tests for empty, whitespace-only, CRLF, tabs, multiple spaces, Unicode and a 5 MiB input; export from `packages/core/src/index.ts`.

**Phase B — the status bar (PR B)**

2. `AppStatusBarContainer` derives the count from the active session (`countWords(active.text)`, `null` when there is no note or the note failed to open) and passes `wordCount`; `AppStatusBar` renders the formatted count in the trailing slot of `StatusBar`; delete `save-state.ts` and `save-state.test.ts`; rewrite `AppStatusBar.test.tsx` (the count is shown, `null` renders an empty bar, no save wording). Tests.
3. Remove the `saveStatus.*` keys from `i18n/locales/en.json`; update `i18n.test.ts`; update `AppSaving.test.tsx`, `ExternalChanges.test.tsx` and `WorkspaceLost.test.tsx` to assert the tab's accessible name ("a not saved") and the count instead of the removed text. Tests.
4. `@basalt/ui` stories and docs: update the E01 guide, the design-system documentation and the screen stories. Run `npm run safety-net`.
5. e2e: rewrite the status-bar tests in `saving.spec.ts` (the tab dot and its accessible name carry the unsaved state; the bar has no save wording), update the `saveState` helpers in `notes-roundtrip.spec.ts` and `external-changes.spec.ts`, and add `status-bar.spec.ts` for AC-07.1–07.8 (the count appears and updates as you type, "0 words" for an empty note, nothing when no note, no save wording, the count survives a paused save).
6. Update AC-01.11 and AC-01.19 in `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md`, the UI/UX lines that name the status bar save state ("Status bar" and "Editing and saving") and the "Out of scope" word-count item to the refined wording; run the `SDLC.md` validation gate.
