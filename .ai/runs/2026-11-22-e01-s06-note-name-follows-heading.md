---
date: 2026-11-22
slug: e01-s06-note-name-follows-heading
type: run
status: completed
tags: [e01, e01-s06, notes, rename, links]
---

# Run: E01-S06 the note name follows its first heading

## Goal

Implement `.ai/specs/implemented/2026-11-16-note-name-follows-first-heading.md` (issue #34).

## What was done

- core: `note-heading.ts` (`firstHeading`, `setFirstHeading`), `rewriteLinksTo`, `renameNoteByTitle`, `rewriteIncomingLinks`; `createNote` writes `# `.
- editor: `onSelectionChange`, `onBlur`, `focus(position)`, `setLabel` (compartment); `setText` maps the selection through the diff instead of clamping.
- app: `NoteSession` gained `id`, `titlePending` and `titleError`; `commitTitle`, `applyTitle`, `commitPendingTitles`, `dismissTitleError`; the title tracker fires the commit when the cursor leaves the heading or on blur; the tree rename calls `applyTitle`; the leave flow commits pending titles first; the editor area is keyed by session id and the image hub path only changes with the folder, so a rename does not remount the editor.
- Existing e2e specs updated for the `# ` initial content and the heading insert on tree rename; `e2e/note-title.spec.ts` added.

## Decisions

- A commit only runs for a session with `titlePending`, set when an edit changes the first heading text (or a note is created). Opening a note and clicking away never renames it (the spec rejects two-way sync on open).
- `firstHeading` parses only the prefix up to each `# ` candidate line, so per-keystroke detection stays cheap in large notes.
- The title alert stays an alert above the editor (E01-S08 Q6), not a toast.

## Open issues

- A failed rename keeps `titlePending`, so every blur retries and re-shows the alert until the heading is fixed.
- Real window close with a pending title is covered at unit level only (UNVERIFIED on desktop).
