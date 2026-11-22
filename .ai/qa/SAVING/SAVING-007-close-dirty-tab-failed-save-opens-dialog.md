# SAVING-007 — Opens the save-failed dialog with focus on Cancel when a dirty tab is closed and the save fails

| Field          | Value                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-007                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                              |
| Requirement    | [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                        |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"opens the save-failed dialog with focus on Cancel when a dirty tab is closed and the save fails"` |
| Run            | `npx playwright test --grep @SAVING-007` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                                |

## Scenario

Given note `a` with `base`, open, with `typed` appended
And the next write will fail
When the owner closes tab `a`
Then a dialog says `Could not save "a"` with `Something went wrong.`
And focus is on Cancel

## Steps observed in the app

| #   | Action        | Observed result              |
| --- | ------------- | ---------------------------- |
| 1   | Close tab `a` | Alert dialog; Cancel focused |

## Related cases

SAVING-008 to SAVING-010 (dialog outcomes), SAVING-011 (clean tab).
