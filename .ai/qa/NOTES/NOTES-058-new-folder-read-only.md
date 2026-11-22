# NOTES-058 — Shows the read-only message in the New folder dialog and creates nothing in a read-only workspace

| Field          | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-058                                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                            |
| Requirement    | [AC-04.3](../../specs/implemented/2026-11-01-manage-notes-and-folders.md), [AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                          |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"shows the read-only message in the New folder dialog and creates nothing in a read-only workspace"` |
| Run            | `npx playwright test --grep @NOTES-058` (from `basalt-app/`)                                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                              |

## Scenario

Given a read-only workspace with the standard notes
When the owner chooses New folder in the `projects` menu and submits `Drafts`
Then the dialog shows the read-only message
And no directory is created

## Steps observed in the app

| #   | Action        | Observed result                          |
| --- | ------------- | ---------------------------------------- |
| 1   | Submit Drafts | Message in dialog; directories unchanged |

## Related cases

NOTES-051.
