# WORKSPACE-009 — Shows the folder name in the sidebar and no Welcome action when a folder is chosen in the picker

| Field          | Value                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | WORKSPACE-009                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                               |
| Requirement    | [AC-01.7](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                          |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"shows the folder name in the sidebar and no Welcome action when a folder is chosen in the picker"` |
| Run            | `npx playwright test --grep @WORKSPACE-009` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                                 |

## Scenario

Given a workspace `/work/My notes` exists and the picker returns it
When the owner chooses Open folder as workspace
Then the sidebar header shows `My notes`

## Steps observed in the app

| #   | Action                          | Observed result              |
| --- | ------------------------------- | ---------------------------- |
| 1   | Choose Open folder as workspace | Sidebar with the folder name |

## Related cases

WORKSPACE-010, WORKSPACE-011. The built-in demo workspace is deliberately not used (seeded data).
