---
date: 2026-11-22
slug: status-bar-word-count
type: run
status: completed
tags: [status-bar, word-count, e01]
---

# Implement E01-S07: status bar word count

## Goal

Implement `.ai/specs/implemented/2026-11-17-status-bar-word-count.md` (issue #36): the status bar shows the word count instead of the save state.

## What was done

- Prototyped four status bar layouts in `prototypes/workspace-basic` (not committed); the owner picked variant B (count at the trailing end, words only) and ruled that bare Markdown markers are not words.
- `@basalt/core`: `countWords` (`text-stats.ts`) counts whitespace tokens that contain a letter or a digit.
- `@basalt/app`: the status bar container derives the count from the active session; `save-state.ts` and the `saveStatus.*` i18n keys are gone; new `statusBar.wordsOne` / `statusBar.wordsMany` keys.
- `@basalt/ui`: screen stories and docs show the count and no save state; `StatusBar` and `SaveStatus` exports are unchanged.
- Tests: new `text-stats.test.ts`, rewritten `AppStatusBar.test.tsx`, word-count cases in `AppSaving.test.tsx`, updated unit and e2e save-state assertions (they read the tab's accessible name), new `e2e/status-bar.spec.ts`.
- Specs: the E01-S07 spec records D-4 and D-5 and moved to `implemented/`; AC-01.11 and AC-01.19 in the S01 spec are refined.

## Decisions

- One PR for both phases of the spec (core and status bar), because the core helper has no visible effect alone.
- The count sits in `StatusBar`'s `trailing` slot, so the leading slot stays empty; E02 decides how the sync state shares the trailing end.
- The two owner decisions override the spec's earlier text (markers counted as words, count leading).

## Outcomes

- Unit, e2e, lint, typecheck and format checks pass locally (see the PR for the full gate).
- Not verified on a real desktop build: e2e runs on the memory platform.

## Open issues

- The clickable prototype was not updated in the repository.
