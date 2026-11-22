# TOASTS-004 — Labels a collision toast Warning with an icon and a countdown line

| Field          | Value                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-004                                                                                                                                         |
| Status         | Active                                                                                                                                             |
| Priority       | Medium                                                                                                                                             |
| Type           | UI                                                                                                                                                 |
| Requirement    | [E01-S08 — toasts name their kind](../../specs/2026-11-17-informational-toasts.md)                                                                 |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"labels a collision toast Warning with an icon and a countdown line"` |
| Run            | `npx playwright test --grep @TOASTS-004` (from `basalt-app/`)                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                   |

## Scenario

Given workspace notes `Ideas`, `Todo`, `Notes`, `Plan` and a folder `projects` holding notes of the same names
When a move collision happens
Then the toast has `data-kind=warning`, the word `Warning`, an icon and a countdown line

## Steps observed in the app

| #   | Action        | Observed result                   |
| --- | ------------- | --------------------------------- |
| 1   | Collide Ideas | Warning toast with icon and timer |

## Related cases

TOASTS-001. The timer is found by its test id; it has no accessible role.
