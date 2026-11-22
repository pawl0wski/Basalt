---
date: 2026-11-22
slug: toast-kinds
type: run
status: completed
tags: [ui, toast, storybook, design-system]
---

# Toast kinds (proposal A)

## Goal


## Done

- `@basalt/ui` `Toast`: `kind` option (`info` | `warning` | `danger`, default `info`), icon, uppercase kind label, countdown line (paused on hover/focus, hidden under reduced motion), `kindLabels` provider prop for translation, `danger` announced assertively.
- `@basalt/app`: `toastKind(error)` maps collisions and not-found/invalid-path to `warning`, stopped moves, failed deletes and link rewrites to `danger`; `FeedbackBridge` passes the kind; labels come from `toasts.kind.*` in `en.json`.
- Storybook stories `Kinds`, `LongContent`; `Toast.mdx` updated; unit tests; e2e test in `e2e/toasts.spec.ts`.
- `.idea/` added to `.gitignore` (owner change, included in the PR).

## Decisions

- Only the three kinds that already have tokens (same as Alert). The prototype's green "success" was dropped: no token exists and adding one needs an owner decision.
- `danger` toasts are only for reported errors; errors needing action remain Alerts (design-system rule 6).

## Outcomes

Toast, feedback, lint, typecheck, stories-as-tests and `e2e/toasts.spec.ts` pass in a Linux copy of the repo. `check:tokens` reports nothing in `Toast.tsx`; it still flags the intentional bad examples in `docs/guide/Avoid.mdx` (not touched by this change).

## Open issues

- Colours of the timer line and label are unverified visually in the real desktop app.
- A "success" kind needs a token decision.
