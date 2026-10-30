---
date: 2026-10-30
slug: design-system-safety-net
type: run
status: completed
tags: [design-system, storybook, ci, tokens]
---

# Design system safety net

## Goal

Add a safety net that runs the Storybook stories as tests and fails when values outside the design tokens (magic numbers, hex colors, Tailwind palette and arbitrary values) are used.

## What was done

- Both checks already existed locally (`check:tokens`, `test:stories:themes`) but nothing ran them in CI, so a regression could reach `master`.
- Added `npm run safety-net` (`check:tokens` then `test:stories:themes`) in `basalt-app/package.json`.
- Added the `safety-net` job to `.github/workflows/ci.yml` (Chromium via Playwright, then `npm run safety-net`).
- `check:tokens` now also scans `packages/app/src` by default, not only `packages/ui`.
- Added `checkTokensCli.test.ts`: the CLI exits 1 with file/line/match on a violation, 0 on token classes, scans directories, and passes on the default project roots.
- Updated the command lists in `design-system.md` and `Contributing.mdx`.

## Decisions

- `test:stories:themes` is used in CI instead of `test:stories`: same run, but per theme, and accessibility violations already fail it (`a11y: { test: "error" }`).
- Separate CI job, so Chromium and Storybook do not slow down the existing frontend job.
- Scope of the token checker stays on class names and literals; it does not flag arbitrary numeric literals in TypeScript logic (timeouts, limits).

## Outcome

`npm run safety-net` passes locally (0 violations, 37 story files / 185 tests). Lint, typecheck, format and unit tests pass. A deliberately inserted `p-[13px] text-white` in `packages/app/src` makes `check:tokens` fail.

## Open issues

- The new CI job has not run on GitHub yet; the first PR run confirms the Playwright install step.
- Consider marking the `safety-net` job as a required status check in branch protection.
