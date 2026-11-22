# WORKSPACE-001 — Returns to Welcome with the unavailable notice and keeps the last workspace when the folder is lost with no unsaved text

| Field          | Value                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-001                                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                                                           |
| Requirement    | [AC-01.5](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                                      |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"returns to Welcome with the unavailable notice and keeps the last workspace when the folder is lost with no unsaved text"` |
| Run            | `npx playwright test --grep @WORKSPACE-001` (from `basalt-app/`)                                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                                             |

## Scenario

Given a workspace with note `a` open and no unsaved text
And the clock is frozen
When the workspace folder is lost
Then the Welcome screen shows `Workspace unavailable` and the Open folder action
And the last workspace is still remembered in the settings

## Steps observed in the app

| #   | Action                          | Observed result     |
| --- | ------------------------------- | ------------------- |
| 1   | Remove the root, advance 300 ms | Welcome with notice |

## Related cases

WORKSPACE-002, WORKSPACE-003 (unsaved text). Missing at launch is in open-workspace.
