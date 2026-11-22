# NOTES-071 — Shows the read-only message and deletes nothing when a note is deleted in a read-only workspace

| Field          | Value                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-071                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                          |
| Requirement    | [AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                   |
| Implementation | [`basalt-app/e2e/delete-notes.spec.ts`](../../../basalt-app/e2e/delete-notes.spec.ts) — `"shows the read-only message and deletes nothing when a note is deleted in a read-only workspace"` |
| Run            | `npx playwright test --grep @NOTES-071` (from `basalt-app/`)                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                            |

## Scenario

Given a read-only workspace with the same notes
When the owner confirms Delete on `Ideas`
Then the read-only message is shown
And the files are unchanged and the `Ideas` row is still shown

## Steps observed in the app

| #   | Action         | Observed result    |
| --- | -------------- | ------------------ |
| 1   | Confirm Delete | Message; unchanged |

## Related cases

NOTES-073.
