---
date: 2026-11-22
slug: bind-editor-actions-to-stable-targets
type: lesson
status: active
tags: [editor, notes, regressions]
---

# Bind editor actions to the edited occurrence or session

An image destination can occur several times on one Markdown line. A resize handle needs the exact alt-text range for its widget, and the widget must refresh that range when document edits move it. Exercise two occurrences with different stored widths and an edit before the line to check both targeting and range updates.

A heading commit can change a note path during the same blur or close interaction. Keep the tab keyed by the session identifier so a rename cannot replace the close button between pointer down and click. Let callers join the in-flight commit for the session and use its returned path. A file-system failure after an asynchronous rename starts must also preserve edits made since the operation began.
