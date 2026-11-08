---
date: 2026-11-08
slug: editor-findings
type: lesson
status: active
tags: [editor, codemirror, markdown]
---

# Editor findings (CodeMirror 6, `@basalt/editor`)

- `setText` resets the undo history and keeps the clamped selection. Intended: after a silent reload from disk, Ctrl+Z must not restore stale text. `setText` does not echo `onChange`.
- `markdown()` continues list markers on Enter. Typing `- one`, Enter, `- two` saves `- one\n- - two`, because the editor already inserted `- ` after Enter. The saved file equals the editor text but not the literal keystrokes. Tests that type lists must account for it; the decision for live preview is an open question in `.ai/specs/2026-11-08-live-preview-editor.md`.
- Clicking blank space below the text does not focus the editor.
- One editor instance per open note, with inactive ones `hidden`, keeps undo, cursor and scroll per tab; memory grows with the number of tabs (no limit yet).
