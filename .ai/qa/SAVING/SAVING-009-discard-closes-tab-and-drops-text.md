# SAVING-009 — Closes the tab and drops the typed text when Discard changes is chosen after a failed save

| Field          | Value                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-009                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                     |
| Priority       | High                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                         |
| Requirement    | [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                   |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"closes the tab and drops the typed text when Discard changes is chosen after a failed save"` |
| Run            | `npx playwright test --grep @SAVING-009` (from `basalt-app/`)                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                           |

## Scenario

Given the save-failed dialog is open for dirty note `a`
When the owner chooses Discard changes
Then no tab remains and the editor area says `No note open`
And the file still holds `base`

## Steps observed in the app

| #   | Action                 | Observed result                      |
| --- | ---------------------- | ------------------------------------ |
| 1   | Choose Discard changes | No tabs; `No note open`; file `base` |

## Related cases

SAVING-008, SAVING-010.
