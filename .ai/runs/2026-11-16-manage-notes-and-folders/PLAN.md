---
date: 2026-11-16
slug: manage-notes-and-folders
type: run
status: completed
tags: [notes, folders, tree, rename, move, e01]
---

# Run plan — manage notes and folders (E01-S04, phases A–D)

Source doc: .ai/specs/2026-11-01-manage-notes-and-folders.md
Refs: #16 (issue), #27 (spec PR, merged). Branch: `feat/manage-notes-and-folders`.

## Tasks

| Phase | Step | Title                                                                                 | Exec     | Status | Commit  |
| ----- | ---- | ------------------------------------------------------------------------------------- | -------- | ------ | ------- |
| 1     | 1.1  | `rename` on WorkspaceFileSystem: port, in-memory fs, contract suite                   | dispatch | done   | 846650e |
| 1     | 1.2  | Tauri and memory-platform `rename` adapters with tests                                | dispatch | done   | d8fd474 |
| 1     | 1.3  | `buildTree` (C-5 filtering and ordering) with tests                                   | dispatch | done   | 490e34b |
| 1     | 1.4  | `rewriteRelativeLinks` (Lezer) with round-trip property test                          | dispatch | done   | c4c771c |
| 1     | 1.5  | `renameNote` and `moveNotes` use cases (collisions, C-8 bulk move) with tests         | dispatch | done   | 53cbf38 |
| 1     | 1.6  | Notes store `renamePath` (tabs, sessions, autosave, settings) and actions with tests  | dispatch | done   | ee5390b |
| 2     | 2.1  | ui `Tree` component (multi-select, drop target) with stories and tests                | dispatch | done   | 88935e2 |
| 2     | 2.2  | ui `ContextMenu` component with stories and tests                                     | dispatch | done   | e0aea82 |
| 2     | 2.3  | ui rename and new-folder dialogs with inline error, stories and tests                 | dispatch | done   | d372415 |
| 3     | 3.1  | app tree store (expansion, selection) and tree adapter with tests                     | dispatch | done   | fb5c583 |
| 3     | 3.2  | Sidebar renders the tree (AC-04.6, 04.8), i18n keys, new note in folder (AC-04.4)     | dispatch | done   | 33843c8 |
| 3     | 3.3  | Context menu and keyboard open (AC-04.9), new folder (AC-04.3)                        | dispatch | done   | 68d0f30 |
| 3     | 3.4  | Rename flow (AC-04.1) and read-only message (AC-04.7)                                 | dispatch | done   | 68d0f30 |
| 3     | 3.5  | Playwright e2e for phase 3 criteria                                                   | dispatch | done   | d88cd80 |
| 4     | 4.1  | Drag a note onto a folder or root: move, tabs follow, hover-open, link rewrite (04.5) | dispatch | done   | 126e277 |
| 4     | 4.2  | Multi-selection (AC-04.10) and bulk move (AC-04.13)                                   | dispatch | done   | db31a2f |
| 4     | 4.3  | Playwright e2e for phase 4 criteria                                                   | dispatch | done   | 9349df0 |
| 4     | 4.4  | Docs: spec status and blocked items, lesson, run log                                  | inline   | done   |         |
| 5     | 5.1  | core + platform: `WorkspaceTrash` port, `deleteNotes`, in-memory trash, adapters, tests | dispatch | done   |         |
| 5     | 5.2  | rust: `move_to_trash` command, `trash` dependency, Rust tests                          | dispatch | done   |         |
| 5     | 5.3  | app UI: `deleteNotes` action, confirm dialog, context menu, i18n, unit tests           | dispatch | done   |         |
| 5     | 5.4  | Playwright e2e for delete (AC-04.2, AC-04.12) and the selection menu (AC-04.11)        | dispatch | todo   |         |
| 5     | 5.5  | Docs: spec status, lesson, run log                                                     | inline   | todo   |         |

## Goal

The owner sees a folder tree, creates folders and notes in folders, renames notes, and moves one or several notes by dragging, with a right-click context menu.

## Scope

Spec phases A–D. Core use cases and port `rename`; ui Tree, ContextMenu, dialogs; sidebar tree; Playwright e2e.

## Non-goals / blocked

- Phase E (delete, OS trash, AC-04.2, AC-04.12 and the "Delete N notes" menu entry of AC-04.11) is blocked on C-1 (⚠ NEEDS HUMAN CONFIRMATION, custom Rust). No Rust, no `WorkspaceTrash`. Without delete, the context menu for a multi-selection has no entry, so it does not open.
- C-8 applies to bulk move only. C-9 as proposed (no folder rename, move or delete).
- PR uses `Refs #16`, never `Closes #16`.

## Risks

- Real Tauri `rename` and drag behaviour cannot be verified on this Linux sandbox; fakes only (see lessons 2026-11-08). Listed UNVERIFIED in the PR.
- Radix context menu and axe gotchas (lessons 2026-10-30).

## Decisions

- Executors read `AGENTS.md` task routes, the spec and `.ai/lessons.md` first. Every Step adds unit tests; e2e in Steps 3.5 and 4.3.

## Phase 3 notes

- Steps 3.3 and 3.4 share one commit (68d0f30): the menu, the dialogs and the rename code were built together on the same files, so they were not split.
- C-5 gap: the "unreadable folder inline error row" is not supported. `WorkspaceFileSystem.list()` returns one flat recursive listing and does not report per-folder read errors, so the tree cannot tell which folder failed. Supporting it needs a change to the port (partial results with per-directory errors). The ui `Tree` already renders a folder `error`.
- ui change in Phase 3: `Dialog` and `NameDialog` gained `onCloseAutoFocus` so focus returns to the tree row after the dialog closes.
- Focus gotcha (e2e only, jsdom cannot reproduce): Radix restores focus to the previous element after a context menu closes. After choosing an item this stole focus from the new dialog input and from the editor of a new note; focus is now restored only when the menu is dismissed without choosing.

## Phase 4 notes

- The context menu is not shown for a selection of 2 or more notes. Its only entry (AC-04.11 "Delete N notes") is blocked on C-1. Right-clicking a selected note of a multi-selection does nothing; right-clicking an unselected note clears the selection and shows that note's menu (covered by unit tests). A selection of one note shows the normal note menu.
- `AppError` gained an optional structured `detail` (`move-collision`, `move-stopped`) so the C-8 messages are localised (`tree.move.*`); the English `message` stays for logs.
- Move failures reuse the sidebar `createError` alert (cleared by the next successful move or create).

## Completion (2026-11-16)

- Phases A–D implemented and committed. Validation gate green: `format:check`, `lint`, `typecheck`, `npm test` (1473 unit tests), `npm run build`, `npm run test:e2e` (162 tests, 30 of them in `e2e/move-notes.spec.ts`). `rust:fmt` and `rust:lint` could not run in this sandbox (no `rustfmt`/`clippy` components installed); no Rust changed in this run.
- Phase E (delete, AC-04.2, AC-04.12 and the "Delete N notes" entry of AC-04.11) stays blocked on C-1 (custom Rust `move_to_trash`), C-8 and C-9 owner confirmation. `deleteNotes` and `WorkspaceTrash` are not implemented. The PR uses `Refs #16`, never `Closes #16`.
- C-5 gap unchanged: per-folder read errors are not surfaced because `WorkspaceFileSystem.list()` is a flat recursive listing that fails as a whole; the ui `Tree` renders a folder `error` but the adapter never sets it. Supporting it needs a port change (partial results with per-directory errors) and is out of scope for A–D.
- Real Tauri `rename` and native drag-and-drop remain UNVERIFIED on this Linux sandbox (fakes and the memory platform only); listed in the PR.
