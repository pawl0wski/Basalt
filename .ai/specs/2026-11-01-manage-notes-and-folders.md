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

This spec is a **skeleton** written from the screen map and the owner's prototype review. It records the acceptance criteria and decisions that are already made. Architecture, API contracts, edge cases and the implementation plan are still to be written (S04 had no spec before; issue #16 says one is owed). The owner can manage notes in the workspace: see a folder tree, create folders, rename, delete (to the OS trash) and move notes by dragging, with actions in a right-click context menu.

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

## 📝 Open items to resolve before implementation

- **OS trash:** check whether official Tauri plugins can move a file to the trash. If not, custom Rust needs a justification here (AGENTS.md). Define what happens when the OS has no trash (the move fails and nothing changes, per AC-04.2, unless the owner decides otherwise).
- Open note with unsaved text that is renamed, moved or deleted (GAP-02); which row is selected and what the main area shows after delete, rename and move (GAP-20).
- Name rules for rename and folders, and a move onto a folder that already has a note of that name (GAP-19).
- Whether the tree shows empty folders, `attachments/` and non-Markdown files (GAP-06); whether expanded folders are remembered and the open note's folder is expanded (GAP-05).
- Rewriting image links when a note moves (S03 Q2, GAP-08), using `resolveLinkTarget` and `buildRelativeLink` from the S03 spec.
- Drag rules (GAP-31): Escape to cancel a drag. A folder opening while hovered is in the prototype (600 ms). Several notes and drops on the workspace root or the note's own folder are decided above (AC-04.13).
- Partial failure of a bulk delete or move (some notes succeed, some fail): the prototype treats both as all-or-nothing; the real behavior is for the spec to decide.
- Selecting folders and deleting or moving folders with notes inside (GAP-07).
- Tree states: loading, cannot be read, empty folder (GAP-10, GAP-11).
- Design-system parts needed: `Tree` (DSG-02), `ContextMenu` (DSG-03), rename and new folder dialogs (DSG-04), operation errors inside dialogs (DSG-05), drag and drop styling (DSG-12).
- Whether note and folder rows show icons. File icons are a "Should have" in the brief; the prototype shows them, and AC-04.8 only requires one style at every depth.
- Architecture, port changes (`rename`, `remove`, `mkdir` as used), Edge Cases & Failure Scenarios, Phasing, Implementation Plan and test plan (Vitest and Playwright in `basalt-app/e2e/`).
