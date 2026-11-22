# WORKSPACE-029 — Animates the sidebar width to zero and back when the sidebar toggle is used

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-029                                                                                                                                                     |
| Status         | Active                                                                                                                                                            |
| Priority       | Medium                                                                                                                                                            |
| Type           | UI                                                                                                                                                                |
| Requirement    | [AC-01.9](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                           |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"animates the sidebar width to zero and back when the sidebar toggle is used"` |
| Run            | `npx playwright test --grep @WORKSPACE-029` (from `basalt-app/`)                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                  |

## Scenario

Given a workspace is open and motion is not reduced
When the owner collapses and expands the sidebar with the toggle
Then the transition duration is above 0 ms
And the width goes to 0 and back above 200 px and the note list is visible again

## Steps observed in the app

| #   | Action              | Observed result              |
| --- | ------------------- | ---------------------------- |
| 1   | Read the transition | Above 0 ms                   |
| 2   | Toggle              | Width 0, aria-expanded false |
| 3   | Toggle              | Width above 200 px           |

## Related cases

WORKSPACE-030. The collapse wrapper has no role, so the test uses its `app-sidebar-collapse` class.
