# TOASTS-011 — Opens the Save-failed dialog and shows no toast when a dirty note is closed and the save fails

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | TOASTS-011                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-08.3](../../specs/2026-11-17-informational-toasts.md) and [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                         |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"opens the Save-failed dialog and shows no toast when a dirty note is closed and the save fails"` |
| Run            | `npx playwright test --grep @TOASTS-011` (from `basalt-app/`)                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given note `a` is open with `typed` appended and the next write will fail
When the owner closes tab `a`
Then the Save-failed dialog is shown and no toast appears

## Steps observed in the app

| #   | Action      | Observed result        |
| --- | ----------- | ---------------------- |
| 1   | Close tab a | Alert dialog; no toast |

## Related cases

SAVING-007.
