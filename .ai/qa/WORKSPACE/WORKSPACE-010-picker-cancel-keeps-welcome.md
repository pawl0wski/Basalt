# WORKSPACE-010 — Keeps the Welcome screen and shows no error or sidebar when the picker is cancelled

| Field          | Value                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-010                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                              |
| Priority       | High                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                  |
| Requirement    | [AC-01.4](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                             |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"keeps the Welcome screen and shows no error or sidebar when the picker is cancelled"` |
| Run            | `npx playwright test --grep @WORKSPACE-010` (from `basalt-app/`)                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                    |

## Scenario

Given the picker is cancelled
When the owner chooses Open folder as workspace
Then the button is enabled again
And no alert and no sidebar appear

## Steps observed in the app

| #   | Action                                  | Observed result             |
| --- | --------------------------------------- | --------------------------- |
| 1   | Choose Open folder as workspace, cancel | Welcome unchanged; no alert |

## Related cases

WORKSPACE-009.
