# NOTES-040 — Offers Rename and Delete when the context menu is opened on a note

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-040                                                                                                                                                      |
| Status         | Active                                                                                                                                                         |
| Priority       | High                                                                                                                                                           |
| Type           | UI                                                                                                                                                             |
| Requirement    | [AC-04.9](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                      |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"offers Rename and Delete when the context menu is opened on a note"` |
| Run            | `npx playwright test --grep @NOTES-040` (from `basalt-app/`)                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                               |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner right-clicks a note
Then the menu offers `Rename` and `Delete`

## Steps observed in the app

| #   | Action            | Observed result |
| --- | ----------------- | --------------- |
| 1   | Right-click Ideas | Rename, Delete  |

## Related cases

NOTES-041 to NOTES-043.
