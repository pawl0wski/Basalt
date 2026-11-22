# WORKSPACE-015 — Explains that the remembered workspace was not found and keeps the picker usable when it is missing at launch

| Field          | Value                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-015                                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                                            |
| Requirement    | [AC-01.5](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                       |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"explains that the remembered workspace was not found and keeps the picker usable when it is missing at launch"` |
| Run            | `npx playwright test --grep @WORKSPACE-015` (from `basalt-app/`)                                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                                              |

## Scenario

Given the settings remember `/gone`, which does not exist
When the app launches and the owner then chooses Open folder as workspace
Then a status says `Workspace not found` and no alert is shown
And the picker still opens a workspace

## Steps observed in the app

| #   | Action                          | Observed result         |
| --- | ------------------------------- | ----------------------- |
| 1   | Launch                          | Status notice; no alert |
| 2   | Choose Open folder as workspace | Sidebar shown           |

## Related cases

WORKSPACE-016, WORKSPACE-001 (lost while open).
