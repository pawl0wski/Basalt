# NOTES-033 — Offers Rename and Delete when the context menu is opened on the only selected note

| Field          | Value                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-033                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                     |
| Priority       | Low                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                         |
| Requirement    | [AC-04.11](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                 |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"offers Rename and Delete when the context menu is opened on the only selected note"` |
| Run            | `npx playwright test --grep @NOTES-033` (from `basalt-app/`)                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                           |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And only `Ideas` is selected
When the owner opens the context menu on `Ideas`
Then the menu offers `Rename` and `Delete`

## Steps observed in the app

| #   | Action            | Observed result |
| --- | ----------------- | --------------- |
| 1   | Right-click Ideas | Normal menu     |

## Related cases

NOTES-031.
