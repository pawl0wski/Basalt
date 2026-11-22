# TOASTS-005 — Shows at most three toasts with the newest last and removes one when its Dismiss button is used after four collisions

| Field          | Value                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-005                                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                                |
| Priority       | High                                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                                    |
| Requirement    | [AC-08.2](../../specs/2026-11-17-informational-toasts.md)                                                                                                                                             |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"shows at most three toasts with the newest last and removes one when its Dismiss button is used after four collisions"` |
| Run            | `npx playwright test --grep @TOASTS-005` (from `basalt-app/`)                                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                                      |

## Scenario

Given workspace notes `Ideas`, `Todo`, `Notes`, `Plan` and a folder `projects` holding notes of the same names
When four collisions happen and the owner dismisses the first toast
Then three toasts are shown, ordered `Todo`, `Notes`, `Plan` from top to bottom and `Ideas` is gone
And after Dismiss two remain

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Collide four notes | Three toasts    |
| 2   | Dismiss the first  | Two toasts      |

## Related cases

TOASTS-006, TOASTS-007.
