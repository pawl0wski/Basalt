# WORKSPACE-019 — Creates an Untitled note when Create your first note is chosen in an empty workspace

| Field          | Value                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-019                                                                                                                                                              |
| Status         | Active                                                                                                                                                                     |
| Priority       | High                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                         |
| Requirement    | [AC-01.8, AC-01.10](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                          |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"creates an Untitled note when Create your first note is chosen in an empty workspace"` |
| Run            | `npx playwright test --grep @WORKSPACE-019` (from `basalt-app/`)                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                           |

## Scenario

Given an empty workspace is open
When the owner chooses Create your first note
Then the list shows exactly `Untitled`

## Steps observed in the app

| #   | Action                        | Observed result     |
| --- | ----------------------------- | ------------------- |
| 1   | Choose Create your first note | List shows Untitled |

## Related cases

WORKSPACE-026.
