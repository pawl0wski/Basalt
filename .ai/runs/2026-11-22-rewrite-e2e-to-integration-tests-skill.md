---
date: 2026-11-22
slug: rewrite-e2e-to-integration-tests-skill
type: run
status: completed
tags: [e2e, playwright, qa, testing]
---

# Rewrite the Playwright e2e suite to the om-integration-tests rules

## Goal

Bring every spec in `basalt-app/e2e/` in line with `.ai/skills/om-integration-tests/SKILL.md` and the installed `om-integration-tests` skill: tagged tests, one Markdown scenario per test, names that state action, condition and outcome, no fixed waits, no per-test timeouts, no reliance on the demo workspace, roles over class selectors.

## What was done

- All 21 spec files rewritten: 241 tests, each tagged `@AREA-NNN`, each with a scenario in `.ai/qa/{AREA}/`.
- Time is driven by `page.clock` through `installClock`, `freezeClock` and `advanceClock` in `support.ts` (constants `AUTOSAVE_DELAY_MS`, `WATCHER_DEBOUNCE_MS`). All `waitForTimeout` calls and per-assertion `timeout` overrides are gone.
- The demo workspace is no longer used as a fixture (`workspace.spec.ts`, `open-workspace.spec.ts`).
- Long tests were split to one business case each; loops that generated tests were unrolled so every variant has its own tag.
- Class selectors replaced by roles where a role exists (`.cm-content` to the note textbox, `.bs-alert` to `alert` or `status`, selected tree rows to `getByRole("treeitem", { selected: true })`).
- Tests removed as duplicates of a kept scenario: demo-workspace open, read-only typing in `notes-roundtrip`, two context-menu tests in `delete-notes`, the long-note scroll check in `add-images`.

## Decisions

- Expected results come from `.ai/specs/`; where no requirement exists the scenario says `Requirement: missing` (TABS-003, TABS-007, WORKSPACE-005, 006, 008, WORKSPACE-020, 021, WINDOW-002 to 004, NOTES-010, 011). These need an owner decision.
- Remaining class selectors: `.bs-status-bar`, `.cm-scroller`, `.cm-editor`, `.cm-line`, `.cm-lp-*`, `img.cm-image-preview`, `.app-sidebar-collapse`, `[data-unsaved-dot]`; none has a role or label.
- The scenario steps describe what the tests verified; the app was not explored by hand through the browser provider.

## Outcome

Full suite green with retries 0. Lint, typecheck and format check pass for `e2e/` and `.ai/qa/`. Link check: 241 tags, 241 scenario files, every `Implementation` path and title resolves.

## Open issues

- The `Requirement: missing` scenarios above.
- Nothing runs against real Tauri; see the PLATFORM gap.
- `basalt-app/best-practices-testow-integracyjnych.md` still fails `format:check`; it is not part of this change.
