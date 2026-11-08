---
date: 2026-11-08
slug: autosave-design-choices
type: lesson
status: active
tags: [autosave, core, design]
---

# Autosave design choices

Core autosave (`@basalt/core`) is a state machine with an injected scheduler. Choices that were needed once the UI was wired:

- `rebase(text)`: a watcher reload that changes the base text must tell autosave the new baseline; otherwise the next save compares against stale text. It ignores the result of a stale in-flight save.
- `pause(error)` and `forceSave()`: a conflict or a failed save pauses autosave (status stays "Not saved"); "Keep my version" or Retry resolves with `forceSave()`. Pending and paused both show "Not saved".
- Follow-up save: edits during an in-flight save trigger exactly one follow-up save that runs immediately after the first completes, without a second debounce.
- Every save re-reads the file before writing (no mtime or size shortcut), so a same-size, same-mtime external change is still detected as a conflict.
- Flush before leaving: closing a tab, changing workspace and closing the window flush first; a failed flush opens the Save-failed dialog (Retry, Discard changes, Cancel with Escape = Cancel).
