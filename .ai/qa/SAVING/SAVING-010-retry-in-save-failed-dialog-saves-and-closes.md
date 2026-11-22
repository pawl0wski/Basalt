# SAVING-010 — Saves the typed text and closes the tab when Retry is chosen and the write now succeeds

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-010                                                                                                                                                              |
| Status         | Active                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                      |
| Requirement    | [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"saves the typed text and closes the tab when Retry is chosen and the write now succeeds"` |
| Run            | `npx playwright test --grep @SAVING-010` (from `basalt-app/`)                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                        |

## Scenario

Given the save-failed dialog is open for dirty note `a`
And the failing write was a single failure
When the owner chooses Retry
Then no tab remains
And the file holds exactly `basetyped`

## Steps observed in the app

| #   | Action       | Observed result           |
| --- | ------------ | ------------------------- |
| 1   | Choose Retry | No tabs; file `basetyped` |

## Related cases

SAVING-008, SAVING-009.
