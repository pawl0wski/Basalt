# TOASTS-008 — Announces the toast through the notifications region and keeps focus on the previously focused row

| Field          | Value                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-008                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                             |
| Priority       | Medium                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                 |
| Requirement    | [AC-08.5](../../specs/2026-11-17-informational-toasts.md)                                                                                                                          |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"announces the toast through the notifications region and keeps focus on the previously focused row"` |
| Run            | `npx playwright test --grep @TOASTS-008` (from `basalt-app/`)                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                   |

## Scenario

Given workspace notes `Ideas`, `Todo`, `Notes`, `Plan` and a folder `projects` holding notes of the same names
And the `Ideas` row has focus
When a collision happens
Then one toast is in the notifications region, which is a status region
And the `Ideas` row still has focus

## Steps observed in the app

| #   | Action        | Observed result           |
| --- | ------------- | ------------------------- |
| 1   | Collide Ideas | One toast; focus on Ideas |

## Related cases

TOASTS-001.
