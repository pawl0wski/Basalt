---
date: 2026-11-22
slug: e01-s09-scrolling-model
type: run
status: completed
tags: [e01, e01-s09, ui, scrolling]
---

# Run: E01-S09 scrolling model

## Goal

Implement `.ai/specs/implemented/2026-11-17-scrolling-model.md` (issue #35).

## What was done

- Tokens `--bs-scrollbar-{size,thumb,thumb-hover,track}`, `--spacing-scrollbar`, colour utilities (also in `utils.ts`), and a `scrollbar-thin` utility in `styles.css` (standard properties, `::-webkit-scrollbar` only under `@supports not`).
- `AppShell` `main` is `overflow-hidden` and no longer a tab stop; the editor's `.cm-scroller` is the rightmost scroller and carries the same tokens.
- `NoteSidebar` gained an `error` prop: notice and error share one fixed slot above the tree, which is the only scroller. `WorkspaceSidebar` passes `createError` there.
- The welcome view root is its own keyboard-reachable scroller. `ScrollArea` gained `type` (default `always`) and uses the scrollbar tokens; the dead `bs-scroll-area` class is gone. `ErrorBanner` is no longer `sticky` (the column does not scroll).
- Vitest and `e2e/scrolling.spec.ts`.

## Decisions

- Phase 0 (the `prototypes/scroll-model/` owner review, D-2) was skipped: it needs the owner. The treatment is thin native scrollbars on every platform; macOS overlay scrollbars stay the platform's.
- The failed-move error: E01-S08 routes most errors to toasts; the sidebar slot still carries `createError` for the cases that remain there.

## Open issues

- Manual smoke test on Windows, Linux and macOS desktop builds (AC-09.4) is UNVERIFIED.
- No contrast pair was added for the thumb (it reuses `border-control`).
