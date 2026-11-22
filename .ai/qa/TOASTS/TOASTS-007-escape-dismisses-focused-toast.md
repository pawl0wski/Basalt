# TOASTS-007 — Dismisses the toast when Escape is pressed with the toast focused

| Field          | Value                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-007                                                                                                                                        |
| Status         | Active                                                                                                                                            |
| Priority       | Medium                                                                                                                                            |
| Type           | UI                                                                                                                                                |
| Requirement    | [AC-08.6](../../specs/2026-11-17-informational-toasts.md)                                                                                         |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"dismisses the toast when Escape is pressed with the toast focused"` |
| Run            | `npx playwright test --grep @TOASTS-007` (from `basalt-app/`)                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                  |

## Scenario

Given one collision toast is visible and focused
When the owner presses Escape
Then no toast remains

## Steps observed in the app

| #   | Action                        | Observed result |
| --- | ----------------------------- | --------------- |
| 1   | Focus the toast, press Escape | No toast        |

## Related cases

TOASTS-006.
