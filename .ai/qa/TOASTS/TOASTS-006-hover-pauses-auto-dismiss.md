# TOASTS-006 — Keeps a toast visible while the pointer is on it past the auto-dismiss time and removes it after the pointer leaves

| Field          | Value                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-006                                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                                              |
| Priority       | Medium                                                                                                                                                                                              |
| Type           | UI                                                                                                                                                                                                  |
| Requirement    | [AC-08.6](../../specs/2026-11-17-informational-toasts.md)                                                                                                                                           |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"keeps a toast visible while the pointer is on it past the auto-dismiss time and removes it after the pointer leaves"` |
| Run            | `npx playwright test --grep @TOASTS-006` (from `basalt-app/`)                                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                                    |

## Scenario

Given one collision toast is visible
And the clock is frozen
When the pointer stays on the toast for longer than the toast duration and then leaves
Then the toast is still visible while hovered
And after the pointer leaves and the duration passes it is gone

## Steps observed in the app

| #   | Action                                  | Observed result |
| --- | --------------------------------------- | --------------- |
| 1   | Hover, advance 6 500 ms                 | Toast stays     |
| 2   | Move the pointer away, advance 6 000 ms | Toast gone      |

## Related cases

TOASTS-007 (focus).
