---
date: 2026-11-08
slug: live-preview-editor
type: spec
status: implemented
tags: [editor, live-preview, codemirror, markdown, e01]
---

# Live-preview Markdown editor (E01, extracted Phase 3)

Extracted from `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` (Phase 3, decision Q1) when Phases 1 to 2b were built. Engineering law: `AGENTS.md` and `.ai/specs/implemented/2026-10-17-engineering-standards-package-structure.md`. Screen ids (s03, s07) refer to `prototypes/e01-screen-map.md`.

## Problem

The owner wants live preview in epic E01 (decision D-5 of the screen map, 2026-10-31; review of 2026-11-01: "seamless, like Obsidian"). Today `@basalt/editor` ships source mode only: Markdown language, history, line wrapping and a Basalt theme. Typing Markdown shows raw syntax everywhere.

## Acceptance criterion

AC-01.18: Live preview: a Markdown line is rendered once the cursor leaves it (for example after Enter); the line with the cursor shows its source. No separate input or source panel appears. The saved file text equals the typed source. (s03, s07)

## Requirements

- There is one editing surface. No separate input element, source panel or preview panel appears.
- The document is always the exact Markdown source (LF in memory). No editor-only metadata is written to the note. Rendering is decoration only.
- Marker syntax is hidden for lines the cursor and selection are not on; the active line or selection shows its source.
- The element list is bounded (below). Anything else needs a new story.
- Future Basalt components (Q10) are added as extensions over a Markdown-compatible syntax; this spec does not build them.

## Approach

Live preview is added to `@basalt/editor` as further CodeMirror 6 extensions passed through the existing `extensions` option of `createMarkdownEditor(parent, { doc, onChange, extensions? })`. The public API (`getText`, `setText`, `focus`, `destroy`) does not change. Decorations are derived from the Lezer Markdown syntax tree and the current selection; the editor state's document is never modified by rendering.

Bounded element list:

1. Headings, emphasis, strong, inline code: markers hidden off the active line.
2. Links, lists, task lists, blockquotes, fenced code: styling. Fence markers (and the info string) and backslash escapes hide off the active line (amended 2026-11-17, E01-S10).

Theme tokens for preview styles come from CSS variables like the existing Basalt theme.

## Finding to resolve: list marker continuation on Enter

`markdown()` from `@codemirror/lang-markdown` continues list markers on Enter. Typing `- one`, Enter, `- two` produces `- one\n- - two` in the saved file, so the file equals the editor text but not the literal keystrokes (found in task 2b.2d; the e2e tests type around it). Live preview makes this more visible, because the continued marker will be rendered as a bullet. Decide the behavior here: keep the Obsidian-style continuation (typing a marker after an auto-inserted one is then the owner's input and an expected result), or turn the continuation off. AC-01.18's "saved text equals the typed source" must be read consistently with that decision.

## Implementation plan

1. Theme tokens for preview styles. Test: default config unchanged.
2. Marker-hiding decorations for headings, emphasis, strong, inline code; source shown on the active line/selection. Tests on decoration sets for given states.
3. Links, lists, task lists, blockquotes, fenced code styling. Tests as above.
4. Playwright: typing Markdown renders the styled result; cursor entry reveals source; saved file text is the exact source. This step must also assert AC-01.18: no separate input element, rendered line after the cursor leaves it, source on the cursor line.

Today's e2e coverage only has the negative check (no separate input or source panel).

## Decisions (autonomous run 2026-11-15, override if wrong)

- Q-LP1: keep Obsidian-style list and quote continuation on Enter. "Saved text equals the typed source" means the saved file equals the editor text (the exact source in the editor), not the literal keystrokes; typing a marker after an auto-inserted one is the owner's input. E2E tests type around it.
- Q-LP2: no new issue was created; the work is tracked under epic #5 (`Refs #5`).
- Q-LP3: not fixed here. Clicking blank space below the text still does not focus the editor; it needs a layout change in the app and is separate from rendering.
- Q-LP4: `setText` rebuilds the state with the same extensions; decorations are derived from the new document and the clamped selection, so nothing extra is preserved. Covered by a test.
- Q-LP5: tables and Basalt components stay out. Images: the S03 display PR owns hiding the `![](...)` source on inactive lines, reusing `activeLineNumbers` from `@basalt/editor`.

## Implementation notes

- `packages/editor/src/livePreview.ts`: a view plugin over the visible ranges, built from `buildLivePreviewDecorations(state, ranges)`. Hidden: ATX heading marker (with its space), emphasis and strong marks, inline code backticks, the opening fence marker with its info string, the closing fence marker, and the backslash of an escape (all only off the active line). Styled only: links, list and task markers, blockquotes, fenced and indented code, headings.

Amended 2026-11-17 by `.ai/specs/implemented/2026-11-17-live-preview-fences-and-escapes.md` (E01-S10): fence markers and escapes now hide; AC-01.18 stays as written.
- `markdown()` now uses `markdownLanguage` (GFM base) so task lists parse.
- Hidden markers leave `textContent`; e2e assertions on non-cursor lines must expect rendered text.
