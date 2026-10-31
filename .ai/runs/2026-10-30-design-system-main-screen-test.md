---
date: 2026-10-30
slug: design-system-main-screen-test
type: run
status: completed
tags: [design-system, storybook, test, gaps, main-screen]
---

# Design system test: the Basalt main screen

## Goal

Build the main application screen using only the existing design system, and report
where the system was not enough. The screen is not to be shipped.

## What was done

- Read `basalt-app/packages/ui/docs/design-system.md`, the Storybook docs
  (foundations, primitives, product, patterns, screens) and the reference/token
  sources in `lekcja6/`.
- Wrote the decision list before coding: `lekcja6/test-design-system-decyzje.md`
  (75 decisions: 45 rule, 12 example, 18 guessed).
- Built the screen as one story file:
  `basalt-app/packages/ui/docs/screens/MainScreen.stories.tsx`
  (Storybook → Screens → E00-S01 Main screen), 7 stories: note open, no note,
  sync error, conflict banner, list loading, list error, outline closed.
- Nothing exported from `src/index.ts`, no new components, no tests, no config
  changes. Only token classes and existing components were used.
- Wrote the gap report: `lekcja6/test-design-system-luki.md` (short, Polish).
- Wrote the handoff for the next agent, in English, with locations, work plan and
  open questions: `lekcja6/design-system-handoff-main-screen.md`.
- Captured screenshots at 1440, 768 and 320 px: `lekcja6/screeny-main/`.

## Decisions made

- The window shell, title bar, activity bar and right panel do not exist in
  `@basalt/ui`; they were composed locally in the story from `div`/`aside`,
  `IconButton`, `Button` and token classes, and recorded as gaps.
- The right panel and the status bar surface colours contradict the token
  documentation; `surface-card` and `surface-frame` were used to match the
  existing `NoteSidebar` and `StatusBar` components, and the contradiction was
  reported.

## Verification

- `npm run check:tokens`: 0 violations (no hex, rgb, hsl, oklch, palette class or
  arbitrary value).
- `tsc --noEmit` and `eslint` on the new file: clean.
- `vitest run --project stories`: 38 files, 192 tests pass, including the 7 new
  stories and their accessibility checks.
- Checked in the browser at 1440, 768 and 320 px.

## Open issues

- 6 missing components (window shell, title bar with note tabs, activity bar,
  side panel, badge, tab-like tabs), 6 missing states, 14 missing rules and 8
  contradictions. Details in `lekcja6/test-design-system-luki.md`.
- At 768 px both side panels leave about 120 px for the note column; no rule says
  which panel is closed at that width.
- The design system was not changed, as the task asked.
