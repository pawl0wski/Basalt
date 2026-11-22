# TOASTS-002 — Closes the Rename dialog and shows an already-exists toast when the name was taken after validation

| Field          | Value                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-002                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                              |
| Priority       | High                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                  |
| Requirement    | [AC-08.1](../../specs/2026-11-17-informational-toasts.md)                                                                                                                           |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"closes the Rename dialog and shows an already-exists toast when the name was taken after validation"` |
| Run            | `npx playwright test --grep @TOASTS-002` (from `basalt-app/`)                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                    |

## Scenario

Given note `alpha` with the Rename dialog open and `beta` typed
And `beta.md` is created outside the app
When the owner presses Enter
Then the dialog closes and exactly one toast says the name already exists
And the sidebar shows no status message and `alpha.md` still exists

## Steps observed in the app

| #   | Action                                   | Observed result          |
| --- | ---------------------------------------- | ------------------------ |
| 1   | Type beta, create beta.md outside, Enter | Dialog closed; one toast |

## Related cases

TOASTS-003.
