---
date: 2026-10-17
slug: add-testing-requirements-and-playwright
type: run
status: completed
tags: [testing, playwright, ci, e2e]
---

# Add Testing Requirements and Playwright Integration Tests

## Goal

Require deliberate unit tests for every change, add Playwright integration tests, require them for all new features, and run them in CI.

## Work done

- Added the unit-test and Playwright requirements to `AGENTS.md` and to the testing strategy and CI sections of the engineering standards spec.
- Added `@playwright/test`, `playwright.config.ts` (starts the Vite dev server on port 1420), the `test:e2e` script, and `e2e/welcome.spec.ts` covering the welcome screen.
- Added `e2e/tsconfig.json` and included it in `npm run typecheck`.
- Ignored `coverage`, `playwright-report`, and `test-results` in git, Prettier, and ESLint.
- Added an `e2e` CI job on `ubuntu-latest` (Playwright Chromium does not support Alpine) that uploads the report on failure.

## Decisions

- The e2e job does not use the Alpine container used by the other jobs, because Playwright browsers need glibc.

## Outcomes

- Lint, typecheck, and format checks pass.

## Open issues

- The e2e tests could not be run in this environment: Chromium fails to start because system libraries (for example `libglib-2.0`) are missing and there is no `sudo`. The first CI run is their first real execution.
