---
date: 2026-11-01
slug: focus-new-note
type: lesson
status: active
tags: [prototype, editor, focus, bug]
---

# A note that opens by itself must put the cursor in the editor

## What happened

After "New note" was changed from a dialog to instant creation, the new note opened but typing did nothing: the line input was rendered and never focused (the old flow had focus inside the dialog, and the editor only took focus after a click on a line).

## Lesson

- When a flow that used to end with a dialog and a click becomes instant, check where focus lands. State tests passed, so only a UI test that types after the action catches this.
- Add a test that performs the action and then types, for every flow that opens a note.
