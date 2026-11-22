# WORKSPACE-011 — Shows the could-not-be-found error and stays on Welcome when the chosen folder cannot be opened

| Field          | Value                                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-011                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                              |
| Requirement    | [AC-01.6](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                         |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"shows the could-not-be-found error and stays on Welcome when the chosen folder cannot be opened"` |
| Run            | `npx playwright test --grep @WORKSPACE-011` (from `basalt-app/`)                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                                |

## Scenario

Given the picker returns a folder that does not exist
When the owner chooses Open folder as workspace
Then an alert says `The file or folder could not be found.`
And Welcome stays with the enabled button

## Steps observed in the app

| #   | Action                    | Observed result      |
| --- | ------------------------- | -------------------- |
| 1   | Choose the missing folder | Alert; Welcome stays |

## Related cases

WORKSPACE-010. A failed listing with Retry in the sidebar is Vitest only (see spec status).
