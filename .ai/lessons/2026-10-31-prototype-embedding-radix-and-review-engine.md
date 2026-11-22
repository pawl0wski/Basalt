---
date: 2026-10-31
slug: prototype-embedding-radix-and-review-engine
type: lesson
status: active
tags: [prototype, review-engine, radix, focus, react, testing]
---

# Embedding a React app in the review engine: focus, remounting and effect order

## What happened

Building `prototypes/workspace-basic/` (Vite + React on `@basalt/ui`, with the review engine from `a local review engine`) surfaced six bugs that unit tests alone did not predict. Each was found by a browser walk or by a test written for a screen.

## Lessons

- **One app, many screens.** Rendering the app inside each `section.screen` remounts it on every screen change, so open menus, focus and editor state are lost. Render one app in a stable host element (`createPortal` into a detached div) and move that element into the frame of the current screen.
- **Effect order decides deep links.** The engine's `start()` ran in a child effect before the provider registered its `prototype:screen-change` listener, so a URL with `#s03` ended on s01. Register the listener in `useLayoutEffect`, and do not announce the initial screen back to the engine. A test that stubs `window.__PROTOTYPE_START__` guards it.
- **The engine focuses the first `h1`/`h2` in the frame on every screen change.** That closes an open Radix menu (focus outside). Intercept `focusin` in the capture phase on `document` and give focus back to `relatedTarget`; do not edit `prototype.js`.
- **React events bubble through portals.** Keydown in a Radix menu (portaled) reached the tree's `onKeyDown` through the React tree and moved focus. Guard handlers with `event.currentTarget.contains(event.target)`.
- **Activate on `click`, not `mousedown`, in an editor that swaps elements.** Replacing the clicked element on `mousedown` makes the browser skip the `click`, so the engine's comment mode never sees it.
- **One effect for all timers resets them all.** Key each timer (`save-start:path:rev`, `add-complete`) and only start or cancel the ones that changed.
- **A line with the cursor must still show its image.** The editor rendered only the source for the active line, so a pasted image disappeared the moment the cursor stood on its link. Found by a navigation test of the "Add images" screen.
- Do not guess a library defect from a symptom: a first theory (Menu returns focus to its trigger and closes the dialog) was wrong and the workaround was removed once the real cause (the tree key handler) was found.
- Running `pkill -f vite` kills your own shell when the command line contains "vite". Use `kill $(pgrep -f "[b]in/vite")`.
