---
date: 2026-11-22
slug: status-bar-assertions-via-tab-name
type: lesson
status: active
tags: [testing, status-bar, e2e]
---

# Assert the unsaved state through the tab's accessible name

The status bar no longer carries save wording, so tests must not look for `role="status"` or `.bs-save-status`. The unsaved state is the tab named `"<note> not saved"` (`NoteTab`'s `sr-only` text); a saved tab is named just `"<note>"`. Use `getByRole("tab", { name, exact: true })`. A note created through "new note" is named `Untitled`, not `a`; a helper hard-coded to `a` failed only in that one e2e test.

Also: a spec's rule can be overturned by the owner while a prototype is judged (here: marker tokens are not words). Update the spec's acceptance criteria, edge cases and API rules together, not only the code.
