# WORKSPACE-004 — Shows the product title, the introduction heading and one enabled Open folder as workspace action and no other action

| Field          | Value                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-004                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                                                      |
| Requirement    | [AC-01.4](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                 |
| Implementation | [`basalt-app/e2e/welcome.spec.ts`](../../../basalt-app/e2e/welcome.spec.ts) — `"shows the product title, the introduction heading and one enabled Open folder as workspace action and no other action"` |
| Run            | `npx playwright test --grep @WORKSPACE-004` (from `basalt-app/`)                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                        |

## Scenario

Given no workspace is open
When the app starts
Then the page title is `Basalt` and the level-1 heading introduces the product
And one enabled button `Open folder as workspace` exists in the main area
And no `Create new workspace` button exists

## Steps observed in the app

| #   | Action       | Observed result                    |
| --- | ------------ | ---------------------------------- |
| 1   | Open the app | Title, heading and a single action |

## Related cases

WORKSPACE-009 (picker cancelled).
