---
date: 2026-11-16
slug: note-name-follows-first-heading
type: spec
status: draft
tags: [notes, headings, rename, links, e01]
---

# The note name follows its first heading (E01-S06)

Source issue: #34 (E01-S06, epic #5). Depends on: #8 (E01-S01, foundations) and #16 (E01-S04, manage notes and folders, implemented in PR #28). Builds on `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (the "S01 spec"), `.ai/specs/implemented/2026-11-01-manage-notes-and-folders.md` (the "S04 spec") and `.ai/specs/implemented/2026-11-08-live-preview-editor.md`. Design authority: `.ai/specs/product-brief.md`. Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md` (the "standards spec"). Screen ids (s03, s04, …) refer to `prototypes/e01-screen-map.md`.

## 📝 TLDR

The owner (the only confirmed user, D02) wants the first H1 to be the note's name, the way Obsidian's filename-heading sync works. Today the filename and the text are independent: a new note is created as an empty `Untitled.md`, and the tree rename dialog renames the file directly. This spec (future behavior) makes the first H1 the naming source: a new note opens with `# ` and the cursor after it, editing the first H1 renames the file when the cursor leaves the heading, the tree rename edits the heading instead of the file, and links to the renamed note are rewritten.

## 📝 Decisions (owner)

| Id  | Topic             | Decision                                                                                                                                                                                                        |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Title rule        | Only the first top-level ATX H1 (`# `) is the title. `##`+ headings and Setext headings (`Title` + `===`) are not titles (2026-11-16).                                                                          |
| D-2 | Rename timing     | The file renames when the cursor leaves the heading line — Enter, an arrow key, a click elsewhere, leaving the editor or closing the window (2026-11-16).                                                        |
| D-3 | Empty heading     | A heading left empty or cleared is restored to the note's previous title — its current file name — when the cursor leaves it. A note with no heading at all keeps its file name (2026-11-16).                    |
| D-4 | Case-only change  | A case-only heading change (`# test` → `# Test`) renames the file, like AC-04.1 (2026-11-16).                                                                                                                    |
| D-5 | Heading text      | The file name uses the heading's plain text with inline formatting stripped (`# **Test**` → `Test.md`). The app writes plain heading text when it sets the heading itself (new note, tree rename) (2026-11-16).    |
| D-6 | Links to the note | A rename rewrites links that point to the renamed note in every note of the workspace, including the renamed note itself (2026-11-16).                                                                          |
| D-7 | Tree rename       | The tree rename sets the note's first H1 instead of renaming the file directly. A closed note is edited on disk and is not opened; an open note gets the heading set in its editor session (2026-11-16).         |

## 📝 Acceptance criteria

The issue's criteria are refined below; the derived ones make the decisions explicit. Screen ids refer to the screen map.

| Id      | Criterion                                                                                                                                                                                                                                                       | Screen   |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC-06.1 | Given a new note, then its content is `# ` and the cursor is in the heading; typing `Test` and leaving the heading creates or renames `Test.md`.                                                                                                                | s04      |
| AC-06.2 | Given a note named `Untitled`, when the first H1 becomes `Test` and the cursor leaves the heading, then the file becomes `Test.md`, the tab and tree update, and links to it are rewritten.                                                                      | s03, s09 |
| AC-06.3 | Given a note open in the editor, when the owner renames it in the tree, then its first H1 changes and the file follows. Given a closed note, when the owner renames it in the tree, then the file's first H1 changes and the file follows, and the note is not opened. | s11      |
| AC-06.4 | Given a heading that is empty, invalid or colliding, then the note keeps its previous filename and text; the owner sees a clear error.                                                                                                                          | s03      |
| AC-06.5 | Given a note without an H1, then its filename does not change.                                                                                                                                                                                                  | s03      |
| AC-06.6 | Given a heading left empty or cleared, when the cursor leaves it, then the heading is restored to the note's current file name and no file changes.                                                                                                             | s03      |
| AC-06.7 | Given a case-only heading change, then the file is renamed.                                                                                                                                                                                                     | s03      |
| AC-06.8 | Given a rename, then links to the renamed note are rewritten in every note of the workspace, including the renamed note itself.                                                                                                                                 | s03, s09 |
| AC-06.9 | Given a rename while the note is open, then the editor keeps its cursor and selection; the rename does not reset the view.                                                                                                                                      | s03      |

## 📝 Not doing

- **Two-way sync (filename → heading on open).** The Obsidian plugin of record also overwrites the first heading when opening a file whose heading differs from its name. Not here: it rewrites note text on open, and D-1/D-3 make the heading the source (owner, 2026-11-16).
- **Renaming on every keystroke.** The commit fires when the cursor leaves the heading, not while typing (D-2).
- **Setext headings and `##`+ headings as titles.** D-1.
- **A title field in front matter or a sidecar.** Nothing is injected into notes (S01 Data Model); the title stays derived.
- **Rewriting incoming links on move.** S04 C-7 stays as-is: moving a note or folder does not rewrite links in other notes. D-6 applies to rename only. The asymmetry is recorded in Risks.
- **A "sync now" command or a settings toggle.** No settings screen exists in E01.

## 📝 Problem statement

- The owner tested epic E01 and reported the mismatch (owner feedback, 2026-11-16, issue #34): the file name is the only name, but the note's visible title is its first heading. Renaming in the tree leaves the heading stale; typing a heading leaves the file name stale.
- The cost today: the owner names a note twice (tree rename plus heading) or lives with a mismatch; a new note is `Untitled.md` with an empty first line instead of a title.
- Who: the owner, the only confirmed user (D02). No other user is confirmed.

## 📝 Proposed solution

Make the first H1 the naming source, in one direction:

- A pure core rule extracts the first top-level ATX H1 and its plain text; the file name is that text.
- A new note is created with `# ` and opened with the cursor after the marker; the file keeps its placeholder name until the heading is filled.
- When the cursor leaves the heading line, the app commits the title: flush the save, validate the name, check collisions, rename the file, rewrite links, update the tree, tabs and settings.
- The tree rename sets the first H1 (inserting one when the note has none) instead of renaming the file directly; a closed note is edited on disk without being opened.
- An empty heading is restored to the current file name; an invalid or colliding heading keeps the file and the text and shows a clear error.

Alternatives considered:

- **Two-way sync on open.** Rejected (Not doing).
- **Rename on a debounce while typing.** Rejected: renames mid-word and churns the watcher and the tree; the owner chose leaving the heading (D-2).
- **A separate title field (front matter).** Rejected: violates "nothing is injected into notes" and plain-file readability.
- **Keep the status quo (file name only).** Rejected: it is the reported problem.

## 📝 Architecture

- **`@basalt/core`.** New pure module `note-heading.ts`: `firstHeading(text)` (the first top-level `ATXHeading1` node: plain text with inline marks stripped, plus the line and content ranges) and `setFirstHeading(text, title)` (replace the heading content, or insert `# title` at the top when there is none). `link-rewrite.ts` gains `rewriteLinksTo(text, notePath, oldTarget, newTarget)` (rewrite destinations that resolve to `oldTarget`; reuses `resolveLinkTarget`/`buildRelativeLink` and the existing suffix and `<...>` handling). `note-operations.ts` gains `rewriteIncomingLinks({ oldPath, newPath, skip })` (scan every note, rewrite links to `oldPath`, write changed notes atomically, collect failures) and `renameNoteByTitle({ path, title })` (the closed-note flow: the `openNote` checks, set the heading, rewrite the note's own links, write atomically with the file's EOL/BOM, then rename; validation and collisions as `renameNote`). `createNote` writes `# ` as the initial content.
- **`@basalt/editor`.** `createMarkdownEditor` gains `onSelectionChange(selection)`, `onBlur()`, `focus(position?)` and `setLabel(label)`; `setLabel` reconfigures the aria-label through a compartment instead of recreating the view, so a rename does not reset the cursor.
- **`@basalt/app`.** `features/editor/title-commit.ts` (pure): given the previous selection, the next selection and the text, decides whether the cursor left the heading. `NoteEditor` forwards selection and blur events, calls `setLabel` instead of recreating on a label change, and passes the commit callback. The session gains a stable `id` so a rename does not remount the editor. `features/notes/notes-actions.ts`: `commitTitle(path)` (the commit flow), `applyTitle(path, title)` (the tree rename, open and closed), `rewriteLinksAfterRename(oldPath, newPath)` (open sessions first, then the disk scan with `skip`), and the session `titleError`. `features/tree/`: the rename dialog calls `applyTitle`. `features/editor/`: a dismissible title alert above the editor. The leave flow commits the active note's title before flushing on window close. i18n keys `notes.titleError.*`.
- **`src-tauri`.** No change: no new command, permission or dependency. `@lezer/markdown` is already a core dependency.

E01-S05 (`.ai/specs/2026-11-16-rename-move-delete-folders.md`) changes the same rename dialog for folders. The two changes are orthogonal: the dialog gains a kind and the note kind's submit calls `applyTitle`; folder kinds keep their own submit.

## 📝 Data model

- No new persisted entity and no on-disk format change: the title is derived from the first H1, nothing is injected into notes, and the file name remains the identity (`WorkspacePath`).
- In memory: `NoteSession` gains `id` (stable across renames; the editor's React key) and `titleError: AppError | null` (a failed commit; it does not pause autosave). `FocusRequest` gains `position: number | null`.
- `basalt.json` is unchanged: `openNotes` and `activeNote` follow a rename as today (S04 `applyPathChange`).

## 📝 API contracts

```ts
// @basalt/core — note-heading.ts
interface NoteHeading {
    readonly text: string; // plain text, trimmed; "" when the heading is empty
    readonly line: { from: number; to: number }; // the heading line, marker included
    readonly content: { from: number; to: number }; // the text after the marker
}
firstHeading(text: string): NoteHeading | null;
setFirstHeading(text: string, title: string): string;

// @basalt/core — link-rewrite.ts
rewriteLinksTo(
    text: string,
    notePath: WorkspacePath,
    oldTarget: WorkspacePath,
    newTarget: WorkspacePath,
): string;

// @basalt/core — note-operations.ts
rewriteIncomingLinks(input: {
    oldPath: WorkspacePath;
    newPath: WorkspacePath;
    skip: readonly WorkspacePath[];
}): Promise<
    Result<{
        changed: readonly WorkspacePath[];
        failed: readonly { path: WorkspacePath; error: AppError }[];
    }>
>;
renameNoteByTitle(input: {
    path: WorkspacePath;
    title: string;
}): Promise<Result<{ path: WorkspacePath }>>;

// @basalt/editor
onSelectionChange?: (selection: { from: number; to: number }) => void;
onBlur?: () => void;
focus(position?: number): void;
setLabel(label: string): void;

// @basalt/app — notes-actions
commitTitle(path: WorkspacePath): Promise<void>;
applyTitle(path: WorkspacePath, title: string): Promise<Result<WorkspacePath>>;
```

`renameNoteByTitle` order: validate the title and the file name (`validateNoteName`, no leading dot), list and find the note (a regular Markdown file), check the collision by `pathKey` excluding the note itself, parse the disk text (BOM/EOL), `setFirstHeading`, `rewriteLinksTo` for the note's own links, write atomically, then `rename` when the target differs. The heading is written before the file rename, so a failed rename leaves the heading set and the next commit retries (self-healing).

`rewriteIncomingLinks` scans the same entries `listNotes` lists (Markdown files, no dot entries), skips `skip` and the renamed note, reads raw text, rewrites, writes only changed notes (BOM preserved), and continues past failures.

## 📝 UI/UX

- **New note (s04).** No dialog. The note opens with `# ` and the cursor after the marker, so the owner types the title immediately.
- **Heading commit (s03).** Leaving the heading line commits the title. No new control; the tab and the tree row update in place.
- **Tree rename (s11).** The dialog is unchanged (prefilled name, inline validation, collision rejection). Submitting sets the first H1; the file follows. A closed note is not opened.
- **Title error (s03).** A dismissible `role="status"` alert above the editor, as wide as the text column: the reason and the note's current name. Autosave keeps running — this is not the save-error banner. It clears on the next commit for that note or when dismissed.
- **Restore.** An empty heading is replaced with the current file name when the cursor leaves it; no error, no file change.
- **Accessibility.** The alert is announced; the tab and tree labels update through the existing components; the editor keeps its cursor across a rename.

Prototype: `prototypes/workspace-basic/` (screen map `prototypes/e01-screen-map.md`; screens s03, s04, s09, s11).

## 📝 Edge cases & failure scenarios

| Scenario                                                          | Behaviour                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Save in flight when the cursor leaves the heading                 | The commit flushes first (`forceSave`); a failed flush cancels the rename and shows the save error.                |
| Heading equals the current name                                   | No-op: no rename, no error.                                                                                        |
| Case-only change                                                  | Renamed (D-4); on a case-insensitive file system the display name still changes.                                   |
| Heading invalid (`a/b`, `a:b`, `con`, > 255 bytes)                | File and text unchanged; the title alert names the problem.                                                        |
| Heading collides with a sibling (case-only or Unicode form)       | File and text unchanged; the title alert names the collision; the rename retries on the next commit.               |
| Heading empty or cleared                                          | Restored to the current file name when the cursor leaves (D-3); no rename, no error.                               |
| No H1 (never had one, or the line was deleted)                    | No rename; the file keeps its name.                                                                                |
| Setext H1 or `##`+ only                                           | Not a title; no rename.                                                                                            |
| Heading inside a blockquote, list or code block                   | Not a title (top-level only).                                                                                      |
| Heading with inline formatting (`# **Test**`)                     | The file name is the plain text (`Test.md`); the heading text is unchanged.                                        |
| Heading that is an image only (`# ![](img.png)`)                  | Plain text is empty → restore.                                                                                     |
| Rename while the note is dirty                                    | The commit flushes; a failed save cancels the rename.                                                              |
| Rename while the file changed on disk (conflict banner)           | The flush reports the conflict and cancels the rename.                                                             |
| Note deleted externally before the commit                         | `not-found`; the existing deleted-file flow.                                                                       |
| Rename succeeds, link rewrite fails in some notes                 | The rename stands; the title alert reports how many notes could not be updated.                                    |
| Open note with unsaved text contains a link to the renamed note   | Its session text is rewritten (no conflict); autosave persists it.                                                 |
| Closed note contains a link to the renamed note                   | Rewritten on disk; the watcher refresh is a no-op for it.                                                          |
| Link target remote, invalid or outside the workspace              | Left byte-for-byte (existing rules).                                                                               |
| Read-only workspace                                               | The rename fails with `permission-denied`; the file and the text keep their state; the message says nothing changed. |
| Tree rename on a closed note: heading write succeeds, rename fails | The heading is set, the file keeps its name; the next commit retries the rename.                                   |
| Tree rename on a closed note with no H1                           | `# <name>` is inserted at the top; the file is renamed.                                                            |
| Tree rename on a closed note that is too large, not UTF-8 or a symlink | The dialog shows the error; nothing changes.                                                                  |
| Watcher event caused by the rename                                | The existing `busy` marking suppresses the self-inflicted change.                                                  |
| Cursor on the heading when the note is switched or the window closes | The commit fires on blur, or in the leave flow before the flush on close.                                        |
| Rename while the owner keeps typing                               | The editor keeps its cursor and selection (AC-06.9); typing continues where it was.                                |
| Heading text with a trailing dot or space (`# Test.`)             | Rejected by the name rules; the title alert names the problem.                                                     |

## 📝 Risks & impact review

- **Hard to reverse:** the title rule becomes a user-visible contract (the file name follows the heading). Mitigated by the no-H1 fallback, by keeping the file name as the identity, and by the restore rule for empty headings.
- **Workspace-wide link rewrite cost.** Every rename reads every note. Acceptable for the owner's workspace size; failures are collected, not fatal; the scan skips open notes (their sessions handle the rewrite).
- **Automatic renames churn the watcher and the tree.** Mitigated by the commit trigger (leaving the heading) and the existing busy marking.
- **The closed-note tree rename has a failure window** between the heading write and the file rename. The heading-first order self-heals on the next commit; documented.
- **No undo.** A rename is reversed by renaming again; the link rewrite is not versioned. E01 has no Undo (S04 Not doing), and the owner accepted the same here.
- **Asymmetry with move.** Rename rewrites incoming links (D-6); move does not (S04 C-7, S05 D-4). The owner made both calls on 2026-11-16; aligning them is a future story.
- **Market check (2026-11-16).** Obsidian's Filename Heading Sync plugin (community) syncs both directions and overwrites the heading on open, with an optional 200-byte filename limit and auto-stripping of special characters; Obsidian core renames files and updates internal links automatically. This spec takes the one-way rule, the plain-text title and the existing name rules (validation errors instead of auto-stripping) instead.
- **AC-01.10 and AC-04.1 are refined** (new-note content and cursor; the tree rename edits the heading). S01 and S04 stay implemented; their specs are not rewritten.
- **No new Tauri permission, Rust command or dependency.**
- **What tests can and cannot prove.** Playwright runs on the memory platform, so it proves app behavior, not real-disk rename or watcher behavior; the S01/S04 approach to that limit is unchanged.

## 📝 Decisions in play

- **D05** (MVP includes Markdown notes) — this spec refines how a note is named; no scope change.
- **D02** (built for the owner first) — justifies the one-way rule, the workspace-wide scan and the plain-text title.
- **N03** (no backlinks) — the rename-follow link rewrite is link maintenance required by D-6, not a backlink feature. S04 C-7 (no incoming-link rewrite on move) stays as-is.
- Nothing proposed supersedes an active entry.

## 📋 Phasing

1. **PR A, core.** `note-heading.ts`, `rewriteLinksTo`, `rewriteIncomingLinks`, `renameNoteByTitle`. No visible change.
2. **PR B, editor.** `onSelectionChange`, `onBlur`, `focus(position)`, `setLabel`. No visible change.
3. **PR C, commit.** The `# ` initial content and the new-note cursor, the commit flow, the restore, the title alert, the session `id` and cursor preservation, i18n, the leave-flow commit. e2e for AC-06.1, 06.2, 06.4, 06.5, 06.6, 06.7, 06.9.
4. **PR D, tree rename and links.** `applyTitle` (open and closed), the link rewrite orchestration, e2e for AC-06.3 and 06.8.

Closes #34 on PR D only.

## 📋 Implementation plan

Each step is testable and leaves the app working. Vitest next to the code, Playwright in `basalt-app/e2e/` (a new `note-title.spec.ts`, plus updates to the existing specs that create notes or rename them — `workspace.spec.ts`, `notes-roundtrip.spec.ts`, `manage-notes.spec.ts` — for the `# ` initial content and the tree rename), and the validation gate from `SDLC.md`.

**Phase A — core (PR A)**

1. `firstHeading`: top-level ATX H1 only; plain text with emphasis, code, links and images stripped; empty heading; multiple H1s (the first wins); no H1; headings inside blockquotes, lists and code blocks ignored; CRLF input. Tests.
2. `setFirstHeading`: replace an existing heading; insert at the top when there is none; empty text; the rest of the note preserved byte-for-byte. Tests.
3. `rewriteLinksTo`: self-links rewritten; links to other notes unchanged; suffixes and `<...>` preserved; reference definitions; remote, invalid and unsupported schemes byte-for-byte. Tests.
4. `rewriteIncomingLinks`: scans, skips, writes only changed notes, collects failures, BOM preserved, idempotent. Tests with the in-memory file system.
5. `renameNoteByTitle`: the closed-note flow, collision, invalid, not-found, read-only, no-H1 insert, EOL/BOM round-trip, self-link rewrite, heading-before-rename order. Tests.

**Phase B — editor (PR B)**

6. `onSelectionChange` and `onBlur` (update listener and DOM event handler). Tests.
7. `focus(position)` and `setLabel` (compartment reconfigure). Tests: the cursor lands at the position; a label change does not reset the document or the selection.

**Phase C — commit (PR C)**

8. `createNote` writes `# `; the new-note flow opens it with the cursor at the end of the first heading; existing tests updated. Tests.
9. `title-commit.ts` (pure): the previous/next selection decision, including blur and the heading line range. Tests.
10. The commit flow in `notes-actions`: restore, no-op, rename, the title alert, error clearing. Tests with fake ports.
11. The session `id` and `setLabel` wiring; the cursor survives a rename (AC-06.9). Tests.
12. i18n keys and texts; every key resolves. Tests.
13. The leave flow commits the active note's title before flushing on window close. Tests.
14. e2e: AC-06.1, 06.2, 06.4, 06.5, 06.6, 06.7, 06.9.

**Phase D — tree rename and links (PR D)**

15. `applyTitle` open and closed; the dialog wiring; the closed note is not opened. Tests.
16. `rewriteLinksAfterRename`: open sessions first, then the disk scan with `skip`; failure reporting. Tests.
17. e2e: AC-06.3 and 06.8 (links rewritten in other notes and in the renamed note; the tree rename on a closed note does not open it).
