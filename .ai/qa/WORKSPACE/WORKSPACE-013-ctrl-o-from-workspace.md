# WORKSPACE-013 — Switches to the picked workspace when Ctrl+O is pressed in an open workspace

| Field          | Value                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-013                                                                                                                                                                |
| Status         | Active                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                           |
| Requirement    | [AC-01.20](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                     |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"switches to the picked workspace when Ctrl+O is pressed in an open workspace"` |
| Run            | `npx playwright test --grep @WORKSPACE-013` (from `basalt-app/`)                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                             |

## Scenario

Given workspace `First` is open
And the picker returns `/other`
When the owner presses Ctrl+O
Then the workspace `other` is shown

## Steps observed in the app

| #   | Action       | Observed result       |
| --- | ------------ | --------------------- |
| 1   | Press Ctrl+O | Workspace other opens |

## Related cases

SAVING-012 (failing flush on this path).
