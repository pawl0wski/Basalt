---
date: 2026-11-15
slug: live-preview-e2e-typing
type: lesson
status: active
tags: [editor, e2e, live-preview]
---

# Live preview changes what e2e tests can assert

- Hidden Markdown markers are removed from the line's `textContent` off the cursor line, so `toContainText("*text*")` fails unless the cursor is on that line. Assert rendered text, or move the cursor first.
- `markdown()` continues list and quote markers on Enter, so typing `> quote\nnext` saves `> quote\n> next`. Put such lines last when a test compares the saved source to the typed text.
- `Decoration.replace` for marker hiding is safe from a view plugin only while the range stays on one line; block widgets (images) must come from a state field.
- The sandbox has no `cargo fmt`; the Rust gate cannot run locally.
