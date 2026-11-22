# TOASTS-009 — Shows the toast with no animation and no transition when reduced motion is preferred

| Field          | Value                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-009                                                                                                                                                           |
| Status         | Active                                                                                                                                                               |
| Priority       | Medium                                                                                                                                                               |
| Type           | UI                                                                                                                                                                   |
| Requirement    | [AC-08.4](../../specs/2026-11-17-informational-toasts.md)                                                                                                            |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"shows the toast with no animation and no transition when reduced motion is preferred"` |
| Run            | `npx playwright test --grep @TOASTS-009` (from `basalt-app/`)                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                     |

## Scenario

Given workspace notes `Ideas`, `Todo`, `Notes`, `Plan` and a folder `projects` holding notes of the same names
And reduced motion is preferred
When a collision happens
Then the toast has animation `none` and every transition duration is `0s`

## Steps observed in the app

| #   | Action        | Observed result            |
| --- | ------------- | -------------------------- |
| 1   | Collide Ideas | No animation or transition |

## Related cases

TOASTS-001.
