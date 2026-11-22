# NOTES-072 — Asks once with the count and removes all selected notes and their tabs when Delete 2 notes is confirmed

| Field          | Value                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-072                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                              |
| Priority       | High                                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                                  |
| Requirement    | [AC-04.12](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                          |
| Implementation | [`basalt-app/e2e/delete-notes.spec.ts`](../../../basalt-app/e2e/delete-notes.spec.ts) — `"asks once with the count and removes all selected notes and their tabs when Delete 2 notes is confirmed"` |
| Run            | `npx playwright test --grep @NOTES-072` (from `basalt-app/`)                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                    |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and `projects/Roadmap`
And `Ideas` and `Todo` are open and selected
When the owner chooses Delete 2 notes in the menu and confirms
Then the dialog is named `Delete 2 notes?`
And after confirming only `Notes.md` and `projects/Roadmap.md` remain, both tabs are closed and no row is selected

## Steps observed in the app

| #   | Action                | Observed result                |
| --- | --------------------- | ------------------------------ |
| 1   | Choose Delete 2 notes | Confirmation                   |
| 2   | Confirm               | Notes removed; selection empty |

## Related cases

NOTES-031 (menu), NOTES-073.
