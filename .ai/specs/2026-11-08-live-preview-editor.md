---
date: 2026-11-08
slug: live-preview-editor
type: spec
status: draft
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
2. Links, lists, task lists, blockquotes, fenced code: styling.

Theme tokens for preview styles come from CSS variables like the existing Basalt theme.

## Finding to resolve: list marker continuation on Enter

`markdown()` from `@codemirror/lang-markdown` continues list markers on Enter. Typing `- one`, Enter, `- two` produces `- one\n- - two` in the saved file, so the file equals the editor text but not the literal keystrokes (found in task 2b.2d; the e2e tests type around it). Live preview makes this more visible, because the continued marker will be rendered as a bullet. Decide the behavior here: keep the Obsidian-style continuation (typing a marker after an auto-inserted one is then the owner's input and an expected result), or turn the continuation off. AC-01.18's "saved text equals the typed source" must be read consistently with that decision.

## Implementation plan

1. Theme tokens for preview styles. Test: default config unchanged.
2. Marker-hiding decorations for headings, emphasis, strong, inline code; source shown on the active line/selection. Tests on decoration sets for given states.
3. Links, lists, task lists, blockquotes, fenced code styling. Tests as above.
4. Playwright: typing Markdown renders the styled result; cursor entry reveals source; saved file text is the exact source. This step must also assert AC-01.18: no separate input element, rendered line after the cursor leaves it, source on the cursor line.

Today's e2e coverage only has the negative check (no separate input or source panel).

## Open questions

- Q-LP1 (from the finding above): keep or disable list marker continuation on Enter?
- Q-LP2: Is this a new issue in epic #5, and which story id does it get? (Q1 said "its own spec and issue".) The main spec still called it GAP-30.
- Q-LP3: Clicking blank space below the text does not focus the editor (found in 2b.2d). Fix here or separately?
- Q-LP4: Does `setText` (resets undo history after a disk reload) need to preserve decorations state or the cursor line? It keeps the clamped selection today.
- Q-LP5: Behavior for tables, images (see `.ai/specs/2026-10-25-images-in-notes.md`) and Basalt components is out of this spec; confirm they stay out.
