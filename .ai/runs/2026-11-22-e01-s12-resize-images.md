---
date: 2026-11-22
slug: e01-s12-resize-images
type: run
status: completed
tags: [e01, e01-s12, images, editor]
---

# Run: E01-S12 resize images by dragging

## Goal

Implement `.ai/specs/implemented/2026-11-17-resize-images-by-dragging.md` (issue #40).

## What was done

- `packages/editor/src/imageWidth.ts`: `parseImageAlt`, `formatImageAlt`, `clampImageWidth` (40–2000 px). Placed in `@basalt/editor`, not `@basalt/core`: the editor is a leaf package and cannot import core (the spec's review finding).
- `imagePreview.ts`: a resize handle (button, accessible name, keyboard and pointer, double-click reset). The handle locates the `Image` node from the widget's DOM position at commit time, so the widget needs no document offsets. One `input.resize` transaction per gesture, isolated in history. `updateDOM` keeps the image element when only the alt changes.
- i18n key `attachments.resize.label`; core test that `rewriteRelativeLinks` keeps the `|W` suffix.
- Vitest, and `e2e/resize-images.spec.ts` (needs a wide PNG: a 1 px image puts the handle outside the scroller).

## Open issues

- The handle shows on hover and keyboard focus, not on cursor-line presence (AC-12.1 mentions both).
- Real Tauri pointer capture and WebKit behavior are UNVERIFIED.
