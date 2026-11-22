# WORKSPACE-014 — Opens the remembered workspace without the Welcome action when the app launches

| Field          | Value                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-014                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                              |
| Requirement    | [AC-01.5, AC-01.17](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                               |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"opens the remembered workspace without the Welcome action when the app launches"` |
| Run            | `npx playwright test --grep @WORKSPACE-014` (from `basalt-app/`)                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                |

## Scenario

Given the settings remember `/home/me/Restored` as the last workspace and it exists
When the app launches
Then the workspace `Restored` is shown and the Welcome action is gone

## Steps observed in the app

| #   | Action                      | Observed result  |
| --- | --------------------------- | ---------------- |
| 1   | Launch with stored settings | Sidebar Restored |

## Related cases

WORKSPACE-015, WORKSPACE-016.
