# NOTES-051 — Shows the read-only message and creates nothing when New note is chosen in a read-only workspace

| Field          | Value                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-051                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                           |
| Requirement    | [AC-04.4](../../specs/implemented/2026-11-01-manage-notes-and-folders.md), [AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                         |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"shows the read-only message and creates nothing when New note is chosen in a read-only workspace"` |
| Run            | `npx playwright test --grep @NOTES-051` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                             |

## Scenario

Given a read-only workspace with the standard notes
When the owner chooses New note in the `projects` menu
Then the read-only message is shown
And the files are unchanged and no tab opens

## Steps observed in the app

| #   | Action          | Observed result                  |
| --- | --------------- | -------------------------------- |
| 1   | Choose New note | Message; files unchanged; no tab |

## Related cases

WORKSPACE-028.
