# WORKSPACE-030 — Collapses the sidebar without a transition when reduced motion is preferred

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-030                                                                                                                                                     |
| Status         | Active                                                                                                                                                            |
| Priority       | Medium                                                                                                                                                            |
| Type           | UI                                                                                                                                                                |
| Requirement    | [AC-01.9](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (no animation with reduced motion)                                                        |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"collapses the sidebar without a transition when reduced motion is preferred"` |
| Run            | `npx playwright test --grep @WORKSPACE-030` (from `basalt-app/`)                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                  |

## Scenario

Given a workspace is open and the system prefers reduced motion
When the owner collapses the sidebar
Then the transition duration is 0
And the width becomes 0

## Steps observed in the app

| #   | Action              | Observed result |
| --- | ------------------- | --------------- |
| 1   | Read the transition | 0               |
| 2   | Toggle              | Width 0         |

## Related cases

WORKSPACE-029.
