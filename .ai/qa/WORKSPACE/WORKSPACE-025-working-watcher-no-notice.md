# WORKSPACE-025 — Shows no focus-refresh notice when the watcher works

| Field          | Value                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | WORKSPACE-025                                                                                                                              |
| Status         | Active                                                                                                                                     |
| Priority       | Medium                                                                                                                                     |
| Type           | UI                                                                                                                                         |
| Requirement    | [AC-01.8](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                    |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"shows no focus-refresh notice when the watcher works"` |
| Run            | `npx playwright test --grep @WORKSPACE-025` (from `basalt-app/`)                                                                           |
| Review         | AI draft — awaiting human review                                                                                                           |

## Scenario

Given the watcher works
When a workspace is opened
Then the focus-refresh notice is not shown

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Open the workspace | No notice       |

## Related cases

WORKSPACE-024.
