# NOTES-031 — Offers only Delete 2 notes and keeps the selection when the context menu is opened on a selected note

| Field          | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-031                                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                            |
| Requirement    | [AC-04.11](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                    |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"offers only Delete 2 notes and keeps the selection when the context menu is opened on a selected note"` |
| Run            | `npx playwright test --grep @NOTES-031` (from `basalt-app/`)                                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                              |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Ideas` and `Todo` are selected
When the owner opens the context menu on `Ideas`
Then the menu offers only `Delete 2 notes`
And the selection is kept

## Steps observed in the app

| #   | Action            | Observed result  |
| --- | ----------------- | ---------------- |
| 1   | Right-click Ideas | Single menu item |

## Related cases

NOTES-032, NOTES-033.
