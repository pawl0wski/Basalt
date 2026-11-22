# NOTES-073 — Shows the read-only message and keeps the selection when selected notes are deleted in a read-only workspace

| Field          | Value                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-073                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                   |
| Priority       | Medium                                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                                       |
| Requirement    | [AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) and [AC-04.12](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                 |
| Implementation | [`basalt-app/e2e/delete-notes.spec.ts`](../../../basalt-app/e2e/delete-notes.spec.ts) — `"shows the read-only message and keeps the selection when selected notes are deleted in a read-only workspace"` |
| Run            | `npx playwright test --grep @NOTES-073` (from `basalt-app/`)                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                         |

## Scenario

Given a read-only workspace with the same notes
And `Ideas` and `Todo` are selected
When the owner confirms Delete 2 notes
Then the read-only message is shown
And the files are unchanged and the selection is kept

## Steps observed in the app

| #   | Action  | Observed result         |
| --- | ------- | ----------------------- |
| 1   | Confirm | Message; selection kept |

## Related cases

NOTES-071.
