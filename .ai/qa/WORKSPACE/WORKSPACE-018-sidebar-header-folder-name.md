# WORKSPACE-018 — Shows the workspace folder name in the sidebar header and offers no Change workspace button

| Field          | Value                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-018                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                            |
| Priority       | Medium                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                |
| Requirement    | [AC-01.7](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                           |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"shows the workspace folder name in the sidebar header and offers no Change workspace button"` |
| Run            | `npx playwright test --grep @WORKSPACE-018` (from `basalt-app/`)                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                  |

## Scenario

Given a workspace `/work/Basalt notes` is open
When the sidebar is shown
Then its header shows `Basalt notes`
And no Change workspace button exists

## Steps observed in the app

| #   | Action             | Observed result         |
| --- | ------------------ | ----------------------- |
| 1   | Open the workspace | Header with folder name |

## Related cases

WORKSPACE-013 (Ctrl+O).
