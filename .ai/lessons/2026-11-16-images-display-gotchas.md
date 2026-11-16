---
date: 2026-11-16
slug: images-display-gotchas
type: lesson
status: active
tags: [images, react, i18n, editor, e2e]
---

# Image display gotchas

- React StrictMode runs effect cleanup then setup again on mount. A hub that unregisters an object in `dispose()` silently stops notifying it after the fake unmount, and unit tests do not see it because they never run StrictMode. Make registration idempotent (`activate()` in the effect body) and keep a test that does dispose then activate. Only the Playwright run against the dev server caught this.
- The i18n interpolation prefix in this app is a single brace (`{path}`), not `{{path}}`. A wrong prefix renders the raw key text with no error.
- `querySelectorAll("img")` inside a CodeMirror content area also matches `img.cm-widgetBuffer` helper elements. Select by your own class.
- Block widgets sit outside `.cm-line`; the viewport in jsdom is not laid out, so widgets for images near the end of a long note cannot be asserted through the DOM. Inspect the decoration sets through `state.facet(EditorView.decorations)`. That test did not fail when the syntax-tree recompute was removed (the parser finished within one pass), so it is a smoke test, not proof of that rule.
- `URL.createObjectURL` does not exist in jsdom; stub it in tests that load images.
