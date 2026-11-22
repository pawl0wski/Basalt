---
date: 2026-11-22
slug: collision-feedback-at-submit
type: lesson
status: active
tags: [toasts, dialogs, testing]
---

# Exercise both collision paths when changing dialog feedback

The informational-toast implementation handled collisions returned by the filesystem. For a name already visible in the tree, the form disabled submission and the action returned early, so the same collision still appeared inline. The passing browser test created the target after name entry and exercised only the filesystem path.

Test a collision visible at dialog open and a destination that appears after name entry. On submission, both cases should close the originating dialog and display one toast while preserving the files. Keep syntax validation inline. An async result belongs to the dialog that started the operation, so test that it leaves a replacement dialog open.

A preflight collision changes no files. To test partial move feedback, let the move succeed and trigger a failure during link rewriting. Assert the new path and preserved bytes as well as the toast.

In a synthetic Playwright drop, the app clears the drag state in its drop handler. Looking up the old source row to dispatch `dragend` can hang when the move removes that row before the lookup.
