---
date: 2026-11-01
slug: manage-notes-and-folders
type: spec
status: draft
tags: [notes, folders, tree, rename, delete, move, drag-and-drop, trash, e01]
---

# Manage notes and folders (E01-S04)

Prototype: `prototypes/workspace-basic/` (screen map: `prototypes/e01-screen-map.md`; review notes: `prototypes/feedback/prototype-feedback-consolidated.md`). Screen ids (s09, s10, …) refer to that map.

Source issue: #16 (E01-S04, epic #5). Builds on `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (the "S01 spec") and `.ai/specs/implemented/2026-10-25-images-in-notes.md` (the "S03 spec"). Design authority: `.ai/specs/product-brief.md`. Engineering law: `AGENTS.md` and the standards spec.

## 📝 TLDR

This spec was a skeleton (2026-11-01) and was completed on 2026-11-16 by an autonomous run. The owner decisions and acceptance criteria below are unchanged. Everything in "Decisions taken in the completion" is a default proposed by the run and is open for override; items marked ⚠ NEEDS HUMAN CONFIRMATION block implementation of the part they affect. The owner can manage notes in the workspace: see a folder tree, create folders, rename, delete (to the OS trash) and move notes by dragging, with actions in a right-click context menu.

## 📝 Decisions (owner)

| Id  | Topic                 | Decision                                                                                                                                                              |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-2 | Moving a note         | By dragging a note row onto a folder row (2026-10-31). No Move dialog.                                                                                                |
| D-3 | Deleting a note       | Moves it to the OS trash (2026-10-31).                                                                                                                                |
| R-1 | Tree, not paths       | The sidebar shows a folder tree; a note in a folder is shown under its folder, never as `folder/file` (2026-11-01). This replaces the flat list of the S01 spec (G7). |
| R-2 | Quick note            | New note creates `Untitled` at once, in the workspace root, or in the folder whose context menu was used (2026-11-01). The owner moves it later by dragging.          |
| R-3 | Context menu          | Actions open from a right-click context menu. There is no "…" button on rows (2026-11-01).                                                                            |
| R-4 | Read-only error       | The message "The workspace folder is read-only. Nothing was changed." as in the prototype (2026-11-01).                                                               |
| R-5 | Several notes at once | The owner can select several notes in the tree and delete them all at once or move them all at once by dragging (2026-11-01). Rename stays one note at a time.        |

## 📝 Acceptance criteria

AC-04.1 to AC-04.7 are in issue #16. The wording below is the refined version. Screen ids refer to the screen map.

| Id       | Criterion                                                                                                                                                                                                                                                                                                                                                                                                                   | Screen   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC-04.1  | Given an open note, when the owner renames it, then the file is renamed on disk and the note stays open. A name colliding with an existing note (including case-only or Unicode-form-only) is rejected inline. A case-only change of the note's own name is allowed (proposed, GAP-09).                                                                                                                                     | s11      |
| AC-04.2  | Given a note, when the owner deletes it and confirms, then the note is moved to the OS trash, removed from the workspace and closed. If the move fails, nothing changes and an error is shown. Cancel has the initial focus.                                                                                                                                                                                                | s13      |
| AC-04.3  | Given an open workspace, when the owner creates a folder from the context menu of the workspace root or of a folder, then the directory exists in the workspace.                                                                                                                                                                                                                                                            | s10, s12 |
| AC-04.4  | Given a folder, when the owner chooses "New note" in its context menu, then `Untitled` (or `Untitled N`) is created inside that folder at once and opened, with no dialog.                                                                                                                                                                                                                                                  | s10      |
| AC-04.5  | Given a note, when the owner drags its row onto a folder row, then the file is moved and every open tab of that note follows the new path. The folder row is highlighted while it is the drop target.                                                                                                                                                                                                                       | s14      |
| AC-04.6  | Given a workspace with folders, then the sidebar shows an expandable tree. A note inside a folder is displayed under that folder, not as `folder/file`. Selecting a note opens it.                                                                                                                                                                                                                                          | s09      |
| AC-04.7  | Given a read-only workspace, when the owner renames, deletes, moves or creates, then the app shows the read-only message and nothing changes on disk.                                                                                                                                                                                                                                                                       | s10–s14  |
| AC-04.8  | Rows at every depth, including notes inside expanded folders, use the same row style as top-level rows.                                                                                                                                                                                                                                                                                                                     | s09      |
| AC-04.9  | Right-click on a note, a folder or the workspace root opens the context menu. Shift+F10 or the Menu key opens it for the focused row. Rows have no "…" button.                                                                                                                                                                                                                                                              | s10      |
| AC-04.10 | Given the tree, when the owner Ctrl/Cmd+clicks a note, then it is added to or removed from the selection. Shift+click selects the visible notes between the last clicked note and the clicked one, and Shift+Arrow Up/Down extends the selection. Selected rows are highlighted, the tree is `aria-multiselectable`, Escape clears the selection, and a plain click opens one note and clears it. Folders are not selected. | s09      |
| AC-04.11 | Given several selected notes, when the owner opens the context menu on one of them, then it offers only "Delete N notes" (no Rename). Opening it on an unselected note clears the selection and shows the menu of that note.                                                                                                                                                                                                | s10      |
| AC-04.12 | Given several selected notes, when the owner deletes them and confirms once ("Delete N notes?"), then all are moved to the OS trash, removed from the workspace and their tabs close. If the move fails or the workspace is read-only, nothing changes and an error is shown.                                                                                                                                               | s13      |
| AC-04.13 | Given several selected notes, when the owner drags one of them onto a folder row (or the workspace root), then all selected notes are moved and every open tab of them follows. Notes already in the destination are skipped. If any note collides with a name at the destination, nothing is moved and the message names the first collision.                                                                              | s14      |

## 📝 Not doing

- **Moving a note with the keyboard.** Not in E01 (owner, 2026-11-01). This is a conscious exception to design-system rule 8 (every control works without a pointer); the context menu and the rest of the tree are keyboard-operable.
- **Undo after delete.** No Toast with Undo in E01 (YAGNI; S04 criteria do not require it; GAP-23).
- **Rename, move or delete of a folder.** Out of scope for E01; issue #16 names notes only (GAP-07).
- **A Move dialog.** Moving is by dragging (D-2).
- **A "Close Outline" button inside the outline panel.** The outline panel is outside E01 (S01 spec, Out of scope); when it is built, it needs no second close button because the minimize button already does that (owner, 2026-11-01).

## 📝 Decisions taken in the completion (override if wrong)

| Id   | Topic                                           | Default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-1  | OS trash (AC-04.2, AC-04.12)                    | ⚠ NEEDS HUMAN CONFIRMATION. No official Tauri plugin moves files to the trash (checked 2026-11-16: plugin-fs has `remove` only; the `trash` crate is a community Rust library). Proposed: one small custom Rust command `move_to_trash(paths)` using the `trash` crate, validated against the runtime workspace fs scope, with Rust tests. AGENTS.md requires this justification; implementation of delete waits for the owner's yes. Without a trash (the OS reports none) the move fails and nothing changes (AC-04.2). Permanent `remove` is never used as a fallback. |
| C-2  | Unsaved text (GAP-02)                           | Rename and move first flush the note's autosave (`forceSave`); if that fails the operation is cancelled with the save error. Delete does not save and does not ask a second time: the confirm dialog is the confirmation.                                                                                                                                                                                                                                                                                                                                                 |
| C-3  | Selection after operations (GAP-20)             | Rename and move: the tab and the selected row follow the new path. Delete: its tabs close; the active tab moves to the neighbour as for a normal tab close; with none left the empty state shows.                                                                                                                                                                                                                                                                                                                                                                         |
| C-4  | Name rules (GAP-19)                             | A note name is validated with `validateNoteName` (S01) and must not collide by `pathKey` with a sibling. A folder name uses the same rules. A case-only change of the note's own name is allowed (AC-04.1). Moving onto a name that already exists in the destination is a collision (AC-04.13).                                                                                                                                                                                                                                                                          |
| C-5  | Tree content (GAP-06, GAP-10, GAP-11)           | The tree lists directories (including empty ones) and Markdown notes. Other files are not shown. The `attachments` folder at the root is hidden (it is the S03 attachment location). Dot-entries stay hidden. A folder that cannot be read shows an inline error row; an empty folder shows nothing. Rows are sorted folders first, then notes, each by name (case-insensitive, natural).                                                                                                                                                                                 |
| C-6  | Expansion (GAP-05)                              | Expanded folders are kept in memory for the session. Opening a note expands its folders. Nothing is persisted (no change to `basalt.json`).                                                                                                                                                                                                                                                                                                                                                                                                                               |
| C-7  | Image links on move (GAP-08)                    | When a note moves to another folder, every relative destination in it (inline links and images, and link reference definitions) is rewritten with `buildRelativeLink(newNote, resolveLinkTarget(oldNote, d).path)`; `remote`, `invalid` and `unsupported-scheme` destinations stay byte-for-byte. Destinations are found with the Lezer Markdown tree. Links in other notes that point at the moved note are not rewritten (there are no backlinks, N03). A rename within the same folder rewrites nothing. The rewritten text is written together with the move (below). |
| C-8  | Partial failure of bulk delete or move (GAP-12) | ⚠ NEEDS HUMAN CONFIRMATION. The prototype shows all-or-nothing. Real behaviour proposed: bulk move checks every collision first and moves nothing if one collides (AC-04.13); an I/O failure midway stops the run, notes already moved stay moved, and the message names the first failure and the count moved. Bulk delete continues past a failure, and the message names how many were not deleted.                                                                                                                                                                    |
| C-9  | Folders (GAP-07)                                | ⚠ NEEDS HUMAN CONFIRMATION. Rename, move, delete and selection of folders stay out of E01 (issue #16 names notes). Only "New folder" and "New note" exist on folders. Dropping a note on a folder or the root moves it.                                                                                                                                                                                                                                                                                                                                                   |
| C-10 | Drag rules (GAP-31)                             | HTML5 drag and drop on note rows (`dragDropEnabled: false` is already set by S03). Escape cancels a drag (browser default). A folder opens after 600 ms of hover. Dropping on the note's own folder is ignored. Dragging one selected note drags the whole selection (AC-04.13).                                                                                                                                                                                                                                                                                          |
| C-11 | Icons                                           | Rows show a folder or note icon from lucide (`Folder`, `FolderOpen`, `FileText`); one style at every depth (AC-04.8).                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## 📝 Architecture

- **`@basalt/core`.** `WorkspaceFileSystem` gains `rename(from, to): Promise<Result<void>>` (a file or directory; `already-exists` if `to` exists, checked with `stat` first, TOCTOU documented; `not-found`; emits watch events for both paths). A separate port `WorkspaceTrash { moveToTrash(paths): Promise<Result<void>> }` (C-1) keeps the custom Rust out of the file-system contract. New pure modules: `tree.ts` (`buildTree(entries): TreeNode[]` from the flat `list()`, with the C-5 filtering and ordering), `note-operations.ts` (`renameNote`, `moveNotes`, `deleteNotes` use cases over the ports, returning the new paths and per-item failures), `link-rewrite.ts` (`rewriteRelativeLinks(text, oldNote, newNote): string` with `@lezer/markdown` promoted from devDependency to dependency of core).
- **`@basalt/ui`.** New `Tree` (DSG-02), `ContextMenu` (DSG-03, built on Radix context menu, the same family as the existing `Menu`), rename and new-folder dialogs on the existing `Dialog`/`Field` (DSG-04) with an inline error line (DSG-05), drop-target styling (DSG-12). Every component gets Storybook stories, tests and `check:tokens`.
- **`@basalt/app`.** `features/tree/`: a store for selection (multi), expansion and drag state; containers that adapt `buildTree` to `Tree` and call the use cases; the notes store learns `renamePath(old, new)` so open tabs, sessions, autosave and persisted settings follow a path change. i18n keys `tree.*`, `menu.*`, `dialogs.*`.
- **`src-tauri`.** Only if C-1 is approved: `move_to_trash` command and its capability, Rust tests, `Cargo.toml` dependency. No other Rust.

## 📝 API contracts

```ts
interface WorkspaceFileSystem { rename(from: WorkspacePath, to: WorkspacePath): Promise<Result<void>> }
interface WorkspaceTrash { moveToTrash(paths: readonly WorkspacePath[]): Promise<Result<void>> }
renameNote(input: { path; newName }): Promise<Result<{ path: WorkspacePath }>>
moveNotes(input: { paths; destinationFolder: WorkspacePath | null }): Promise<Result<{ moved: readonly { from; to }[] }>>
deleteNotes(input: { paths }): Promise<Result<{ deleted: readonly WorkspacePath[]; failed: readonly { path; error }[] }>>
```

A moved note is first moved with `rename` (atomic, no copy), then, if its links changed, its rewritten text is written with `writeTextAtomic` to the new path (after a re-read, S01 rule). If the second step fails the note stays moved with its old links and the error says so; no text is lost. There is no `remove` on the port; permanent deletion is never used.

## 📝 Edge cases and failure scenarios

| Scenario                                                             | Behaviour                                                                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Read-only workspace                                                  | Every operation returns `permission-denied`; the R-4 message shows; nothing changes (AC-04.7).                    |
| Rename to a colliding name (case-only or Unicode form)               | Rejected inline in the dialog; the dialog stays open.                                                             |
| Rename to its own name with a different case                         | Allowed.                                                                                                          |
| Move to the note's own folder                                        | Ignored, no error.                                                                                                |
| Bulk move where one note collides                                    | Nothing moved; message names the first collision (AC-04.13).                                                      |
| Open note with unsaved text                                          | C-2.                                                                                                              |
| Note changed on disk (conflict banner) while renamed                 | The save before the operation reports the conflict and cancels the operation.                                     |
| Note deleted outside the app while a context menu is open            | The operation reports `not-found`; the tree refreshes from the watcher.                                           |
| OS has no trash or the move fails                                    | Nothing changes; error shown (AC-04.2).                                                                           |
| Folder removed outside the app while expanded                        | The watcher refresh drops the row.                                                                                |
| Drag ends outside any folder, or Escape                              | Nothing happens.                                                                                                  |
| Moving a note whose links point outside the workspace after the move | The link is `invalid` after rewriting: left unchanged.                                                            |
| Name with a path separator in the rename dialog                      | `separator` validation message inline.                                                                            |
| Moving a note that is open in a tab                                  | The tab follows (AC-04.5).                                                                                        |
| Watcher events caused by the app's own operations                    | Existing batching refreshes the tree once; open-note change resolution must ignore the rename it caused (tested). |

## 📋 Phasing

1. **PR A, core.** `rename` on the port (memory, Tauri, contract), `buildTree`, `rewriteRelativeLinks`, `renameNote`, `moveNotes`, notes store `renamePath`. No UI.
2. **PR B, ui.** `Tree`, `ContextMenu`, dialogs, stories.
3. **PR C, tree and rename.** Tree in the sidebar (AC-04.6, 04.8), context menu (04.9), rename (04.1), new folder (04.3), new note in a folder (04.4), read-only (04.7). e2e.
4. **PR D, move and selection.** Drag and drop (04.5, 04.13), multi-selection (04.10, 04.11) with link rewriting. e2e.
5. **PR E, delete.** Blocked on C-1. Trash port, Rust command, confirm dialog (04.2, 04.12). e2e through a fake trash on the memory platform.

Closes #16 on PR E only.

## 📋 Implementation plan

Per phase: Vitest next to the code (contract suite for `rename`; property test that `rewriteRelativeLinks` then `resolveLinkTarget` from the new note equals the old target for every relative link; `buildTree` ordering and filtering; use-case collision and partial-failure tests), Storybook stories for each new ui component, Playwright in `basalt-app/e2e/` for each acceptance criterion above, and the validation gate from `SDLC.md`.

## 📝 Open items still for the owner

- C-1 (custom Rust for the trash), C-8 (partial failure), C-9 (no folder operations in E01).
- Whether `attachments` should be visible in the tree (C-5 hides it).

## 📝 Implementation status (2026-11-16)

- **Phases A–D implemented** (PR #28, branch `feat/manage-notes-and-folders`): AC-04.1, 04.3, 04.4, 04.5, 04.6, 04.7, 04.8, 04.9, 04.10, 04.11, 04.13. Run log: `.ai/runs/2026-11-16-manage-notes-and-folders/`.
- **Phase E (delete) not implemented** — blocked on the owner's C-1 confirmation. AC-04.2 and AC-04.12 are open. `deleteNotes` and `WorkspaceTrash` do not exist yet.
- **C-5 per-folder read errors**: not surfaced, because `WorkspaceFileSystem.list()` is a flat recursive listing that fails as a whole. The ui `Tree` renders a folder `error`; the adapter never sets it. Needs a port change; out of scope for A–D.
- The spec stays in `.ai/specs/` (not `implemented/`) until Phase E lands.
