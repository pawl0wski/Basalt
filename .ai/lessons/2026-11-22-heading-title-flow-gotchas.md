---
date: 2026-11-22
slug: heading-title-flow-gotchas
type: lesson
status: active
tags: [e01, e01-s06, editor, e2e, jsdom]
---

# Heading-to-name flow: gotchas

- A new note now holds `# ` and the cursor sits after it, so anything typed in an e2e test lands in the heading, and leaving the heading (Enter, arrow down) renames the file. Tests that typed into a new or empty note and read `Untitled.md` or `a.md` had to expect the heading text and the renamed file.
- `NoteEditor.setText` used to clamp the selection, which put the cursor inside a heading that had just grown (restoring an emptied heading). It now maps the selection through the common prefix and suffix of the old and new text.
- Parsing the whole note on every keystroke to find the first H1 is too costly in large notes; `firstHeading` parses only the prefix up to each `# ` candidate line.
- Only a changed first heading marks a title as pending. Opening a note or clicking away must never rename it.
- jsdom has no `Range.getClientRects`; CodeMirror measures after a programmatic focus/selection dispatch, so `setupTests.ts` stubs it globally.
- Playwright drag of a 1 px test image puts the resize handle outside the scrollable editor; use a wider PNG when a test needs to hit an image corner.
