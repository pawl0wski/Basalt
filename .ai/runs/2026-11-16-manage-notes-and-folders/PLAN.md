---
date: 2026-11-16
slug: manage-notes-and-folders
type: run
status: interrupted
tags: [notes, folders, tree, rename, move, e01]
---

# Run plan — manage notes and folders (E01-S04, phases A–D)

Source doc: .ai/specs/2026-11-01-manage-notes-and-folders.md
Refs: #16 (issue), #27 (spec PR, merged). Branch: `feat/manage-notes-and-folders`.

## Tasks

| Phase | Step | Title                                                                                 | Exec     | Status | Commit |
| ----- | ---- | ------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 1     | 1.1  | `rename` on WorkspaceFileSystem: port, in-memory fs, contract suite                   | dispatch | done   | 846650e |
| 1     | 1.2  | Tauri and memory-platform `rename` adapters with tests                                | dispatch | done   | (this) |
| 1     | 1.3  | `buildTree` (C-5 filtering and ordering) with tests                                   | dispatch | todo   |        |
| 1     | 1.4  | `rewriteRelativeLinks` (Lezer) with round-trip property test                          | dispatch | todo   |        |
| 1     | 1.5  | `renameNote` and `moveNotes` use cases (collisions, C-8 bulk move) with tests         | dispatch | todo   |        |
| 1     | 1.6  | Notes store `renamePath` (tabs, sessions, autosave, settings) and actions with tests  | dispatch | todo   |        |
| 2     | 2.1  | ui `Tree` component (multi-select, drop target) with stories and tests                | dispatch | todo   |        |
| 2     | 2.2  | ui `ContextMenu` component with stories and tests                                     | dispatch | todo   |        |
| 2     | 2.3  | ui rename and new-folder dialogs with inline error, stories and tests                 | dispatch | todo   |        |
| 3     | 3.1  | app tree store (expansion, selection) and tree adapter with tests                     | dispatch | todo   |        |
| 3     | 3.2  | Sidebar renders the tree (AC-04.6, 04.8), i18n keys, new note in folder (AC-04.4)     | dispatch | todo   |        |
| 3     | 3.3  | Context menu and keyboard open (AC-04.9), new folder (AC-04.3)                        | dispatch | todo   |        |
| 3     | 3.4  | Rename flow (AC-04.1) and read-only message (AC-04.7)                                 | dispatch | todo   |        |
| 3     | 3.5  | Playwright e2e for phase 3 criteria                                                   | dispatch | todo   |        |
| 4     | 4.1  | Drag a note onto a folder or root: move, tabs follow, hover-open, link rewrite (04.5) | dispatch | todo   |        |
| 4     | 4.2  | Multi-selection (AC-04.10) and bulk move (AC-04.13)                                   | dispatch | todo   |        |
| 4     | 4.3  | Playwright e2e for phase 4 criteria                                                   | dispatch | todo   |        |
| 4     | 4.4  | Docs: spec status and blocked items, lesson, run log                                  | inline   | todo   |        |

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
