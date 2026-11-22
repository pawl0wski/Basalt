# WORKSPACE-012 — Opens the picked workspace when Ctrl+O is pressed on the Welcome screen

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-012                                                                                                                                                           |
| Status         | Active                                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                      |
| Requirement    | [AC-01.7, AC-01.20](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                       |
| Implementation | [`basalt-app/e2e/open-workspace.spec.ts`](../../../basalt-app/e2e/open-workspace.spec.ts) — `"opens the picked workspace when Ctrl+O is pressed on the Welcome screen"` |
| Run            | `npx playwright test --grep @WORKSPACE-012` (from `basalt-app/`)                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                        |

## Scenario

Given the Welcome screen is shown
And the picker returns workspace `/work/Keys`
When the owner presses Ctrl+O
Then the workspace `Keys` is shown

## Steps observed in the app

| #   | Action       | Observed result      |
| --- | ------------ | -------------------- |
| 1   | Press Ctrl+O | Workspace Keys opens |

## Related cases

WORKSPACE-013.
