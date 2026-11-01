---
date: 2026-11-01
slug: prototype-feedback-to-specs
type: run
status: completed
tags: [prototype, specs, e01, screen-map]
---

# Prototype feedback and screen map decisions into the specs

## Goal

For every decision in `prototypes/e01-screen-map.md` and every note in `prototypes/feedback/prototype-feedback-consolidated.md`, add a checkable acceptance criterion (with the screen id) to the right spec, or record that it is not done and why. List the screens that have no criterion.

## What was done

- Proposed the full list of changes and waited for the owner's approval; the owner answered seven questions and approved.
- `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md`: prototype path at the top, AC-01.4 to AC-01.20 with screen ids, confirmation texts, instant New note, tabs, status bar without a sync word, banner width and pinning, `openNotes` and `activeNote` in `basalt.json`, Out of scope additions (activity bar, outline, counts, sync word, Settings with "Change workspace"), live preview pointer in Phase 3.
- `.ai/specs/2026-10-25-images-in-notes.md`: prototype path, screen ids on the criteria, Q5 updated for live preview, notice dismissal default.
- New `.ai/specs/2026-11-01-manage-notes-and-folders.md` (E01-S04 skeleton): AC-04.1 to AC-04.9, decisions, "Not doing", open items.
- Lesson `2026-11-01-prototype-review-feeds-specs.md`.

## Decisions (owner, 2026-11-01)

- "Change workspace" leaves the sidebar and will move to Settings later; Ctrl/Cmd+O until then.
- New note, also inside a folder, creates `Untitled` at once.
- No keyboard move of notes in E01.
- Tabs rules and the read-only message as proposed; save-state and confirmation texts as proposed.

## Outcomes

Every screen s01 to s14 has at least one criterion. Details still open are listed in the S04 spec ("Open items") and the screen map gaps.

## Open issues

- The `Close Outline` note was assigned to the S04 "Not doing" list because the outline panel is outside E01.
- Issues #8, #10 and #16 should be updated with the new criteria.
- No schema version bump was written for `basalt.json`: nothing is shipped yet, so the schema changes in place.
- Phase 3 (live preview) stays in the S01 spec until the owner decides on extraction (GAP-30).

## Follow-up: prototype updated (2026-11-01)

- Issues #8, #10 and #16 were updated with the new criteria and spec links.
- `prototypes/workspace-basic/` now follows the new criteria: tree-only sidebar with the workspace name and no Change workspace button, instant `Untitled` notes (no dialog), right-click and Shift+F10 context menu, row icons, animated sidebar and outline panel, banners as wide as the text and pinned, status bar with the save state only, no Undo after delete, seamless cursor line, new s06 texts, Ctrl/Cmd+O and Ctrl/Cmd+N. Tests updated and added (123 pass), typecheck and build pass.
- Not verified in a browser: Chromium could not start on this machine (missing system libraries), so the animation, the pinned banner and the look of the cursor line were not seen, only covered by DOM-level tests.
- `prototypes/e01-screen-map.md` was not updated: it still describes s04 as a dialog and the list/tree switch.

## Follow-up: several notes at once (2026-11-01)

- Owner request: select several notes, then delete or move them all at once.
- Spec `2026-11-01-manage-notes-and-folders.md`: decision R-5 and AC-04.10 to AC-04.13 (selection, context menu for a selection, bulk delete with one confirmation, bulk move by dragging, all-or-nothing on a name clash). Issue #16 updated with the same criteria.
- Prototype: selection state with Ctrl/Cmd+click, Shift+click and Shift+Arrow, `aria-multiselectable`, Escape to clear, "Delete N notes" menu and confirmation, dragging one selected note moves all. Unit and UI tests added (134 pass).
- Defaults chosen by me, not by the owner: Rename is not offered for a selection; bulk delete and move are all-or-nothing in the prototype; folders cannot be selected; notes already at the destination are skipped.

## Follow-up: typing in a new note and middle-click on tabs (2026-11-01)

- Bug found by the owner: after New note the editor line was rendered but not focused, so typing did nothing. The editor now focuses an empty note on mount.
- Owner request: a middle mouse click closes a tab. Added to the prototype (event delegation on the title bar, same flow as the close button) and to AC-01.10 and AC-01.16 in the S01 spec and issue #8. Tests added (137 pass).
