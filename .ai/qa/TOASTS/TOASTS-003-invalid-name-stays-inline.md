# TOASTS-003 — Keeps the invalid-name message inline in the open Rename dialog and shows no toast

| Field          | Value                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | TOASTS-003                                                                                                                                                         |
| Status         | Active                                                                                                                                                             |
| Priority       | Medium                                                                                                                                                             |
| Type           | UI                                                                                                                                                                 |
| Requirement    | [AC-08.1](../../specs/2026-11-17-informational-toasts.md) (only collisions become toasts)                                                                          |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"keeps the invalid-name message inline in the open Rename dialog and shows no toast"` |
| Run            | `npx playwright test --grep @TOASTS-003` (from `basalt-app/`)                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                   |

## Scenario

Given the Rename dialog is open for `alpha`
When the owner types `a/b`
Then the dialog shows `A name cannot contain` and no toast appears

## Steps observed in the app

| #   | Action   | Observed result          |
| --- | -------- | ------------------------ |
| 1   | Type a/b | Inline message; no toast |

## Related cases

TOASTS-002.
