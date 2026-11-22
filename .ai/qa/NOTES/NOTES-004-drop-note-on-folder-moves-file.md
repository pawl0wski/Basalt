# NOTES-004 — Moves the file and opens the destination folder when a note is dropped on a folder row

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-004                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                      |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"moves the file and opens the destination folder when a note is dropped on a folder row"` |
| Run            | `npx playwright test --grep @NOTES-004` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When the owner drops `Ideas` on the `projects` row
Then the file is moved into `projects` and the folder opens to show it

## Steps observed in the app

| #   | Action                   | Observed result                |
| --- | ------------------------ | ------------------------------ |
| 1   | Drag Ideas onto projects | Files moved; projects expanded |

## Related cases

NOTES-005 (real pointer), NOTES-006 (open tab).
