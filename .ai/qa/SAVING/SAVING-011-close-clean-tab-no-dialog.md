# SAVING-011 — Closes a clean tab without opening the save-failed dialog

| Field          | Value                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-011                                                                                                                                         |
| Status         | Active                                                                                                                                             |
| Priority       | Medium                                                                                                                                             |
| Type           | UI                                                                                                                                                 |
| Requirement    | [AC-01.16](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (closing a tab flushes first and opens the dialog only if the save fails) |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"closes a clean tab without opening the save-failed dialog"`          |
| Run            | `npx playwright test --grep @SAVING-011` (from `basalt-app/`)                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                   |

## Scenario

Given note `a` open and unchanged
When the owner closes tab `a`
Then no tab remains and no dialog appears

## Steps observed in the app

| #   | Action        | Observed result          |
| --- | ------------- | ------------------------ |
| 1   | Close tab `a` | No tabs; no alert dialog |

## Related cases

SAVING-007 (dirty tab, failing save).
