---
date: 2026-11-16
slug: paste-drop-e2e-and-alert
type: lesson
status: active
tags: [images, e2e, editor, ui]
---

# Paste and drop: testing and platform notes

- Playwright can drive paste and drop without OS support: build a `DataTransfer` in `page.evaluate`, add `File`s and dispatch `ClipboardEvent("paste")` / `DragEvent("drop")` on `.cm-content`. This proves handler logic only, not real clipboard or file-manager behavior.
- jsdom has no `File.arrayBuffer`, no `Range.getClientRects` (CodeMirror calls it when scrolling a selection into view) and its `DataTransfer` mocks need `getData` for CodeMirror's default handlers. Stub them in the test, do not skip the test.
- `getByRole("status")` matches the status bar as well as `Alert role="status"`; scope to `.bs-alert`.
- `listFiles()` on the memory platform lists files only, not directories.
- CodeMirror's own paste handler calls `preventDefault` for text pastes, so `defaultPrevented` cannot prove a paste was left to the default; assert that `onFiles` was not called.
- Real Tauri plugin-fs is now partly known: with a non-recursive picker scope, `readDir`/`writeFile` below a sub-folder (`attachments/`) fail with `forbidden path` (owner's manual Windows test, 2026-11-16), while `mkdir` of a direct child works. See [workspace-scope-and-forbidden-path](2026-11-16-workspace-scope-and-forbidden-path.md); the memory platform now simulates it with `setScopeDenied`.
- Still UNVERIFIED on real Tauri (Linux WebKitGTK, Windows WebView2): `dragDropEnabled: false` delivering `File` objects, image data in `clipboardData.files`, the drop guard stopping navigation, plugin-fs byte `writeFile` after the recursive-scope fix, and the whole desktop Windows/Linux check of the fix.
