---
date: 2026-11-22
slug: informational-toasts
type: run
status: completed
tags: [toasts, errors, feedback, ui, e01]
---

# Run: informational toasts (E01-S08, #33)

Source doc: .ai/specs/2026-11-17-informational-toasts.md

## Goal

Mount the existing `ToastProvider`, classify every operation error once (`errorSurface`), and show informational ones (collisions, partial failures) as auto-dismissing toasts while actionable errors keep their persistent surfaces.

## Scope

`@basalt/ui` Toast (cap, ids, labels), new `@basalt/app` `features/feedback/`, wiring in `services.ts`, `notes-actions.ts`, `tree-actions.ts`, `AppContainer.tsx`, i18n, unit and Playwright tests.

Non-goals: toast actions, replacing the Save-failed dialog, error catalogue changes, toasting successes, S06 title alert, notification history.

## Implementation Plan

Three phases mirror the spec's Phasing (A ui, B feedback module, C surfaces). The spec's implementation plan lists the steps; the rename and new-folder dialog close-on-collision is implemented in `tree-actions.ts` (the submit path) so the container stays presentational.

Risks: e2e tests that assert `.bs-alert` for collisions must change; rename-collision dialog behaviour changes (owner decision Q3). Validation runs on the memory platform only.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: ui

- [x] 1.1 Toast max stack of 3 and monotonic ids — cdc4672
- [x] 1.2 Toast label and dismissLabel props — cdc4672
- [x] 1.3 Storybook story for the stack cap — cdc4672

### Phase 2: feedback module

- [x] 2.1 error-surface.ts classification — 2895880
- [x] 2.2 feedback-store.ts — 2895880
- [x] 2.3 feedback.ts service — 2895880
- [x] 2.4 Move move-error.ts to feedback/describe-error.ts — 2895880
- [x] 2.5 FeedbackBridge.tsx — 2895880
- [x] 2.6 services.ts wiring — 2895880

### Phase 3: surfaces

- [x] 3.1 Mount ToastProvider and FeedbackBridge, i18n keys — 2895880
- [x] 3.2 Dialog closes on informational submit failure — 2895880
- [x] 3.3 notes-actions report through feedback — 2895880
- [x] 3.4 tree-actions confirmDelete reports through feedback — 2895880
- [x] 3.5 Update existing e2e — 2895880
- [x] 3.6 New toasts.spec.ts — 2895880

## Outcome

All phases implemented. Gate: format, lint, typecheck, unit (1564), build and e2e (183) green; `rust:fmt` and `rust:lint` could not run (cargo fmt/clippy not installed in this environment); no Rust changed.

Decisions: the rename/new-folder dialog closes in `tree-actions.ts` (`failDialog`) rather than in the container; a partial-failure detail (`move-stopped`, `delete-failed`, `move-collision`) wins over the error code in `errorSurface`; Radix puts the region label on the Viewport, so `label` is applied there.

Open: the S04/S05 specs need the follow-up note on the moved collision message (spec follow-up).
