# WORKSPACE-016 — Explains that the remembered workspace is unavailable and keeps the Open action enabled when it cannot be read at launch

| Field          | Value                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | WORKSPACE-016                                                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                                                   |
| Priority       | Medium                                                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                                                       |
| Requirement    | [AC-01.5](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                                  |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"explains that the remembered workspace is unavailable and keeps the Open action enabled when it cannot be read at launch"` |
| Run            | `npx playwright test --grep @WORKSPACE-016` (from `basalt-app/`)                                                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                                                         |

## Scenario

Given the settings remember a workspace whose stored entries are invalid
When the app launches
Then a status says `Workspace unavailable` and no alert is shown
And the Open folder action is enabled

## Steps observed in the app

| #   | Action | Observed result               |
| --- | ------ | ----------------------------- |
| 1   | Launch | Status notice; action enabled |

## Related cases

WORKSPACE-015.
