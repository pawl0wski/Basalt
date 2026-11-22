# NOTES-020 — Selects the notes between the last clicked note and the clicked one when Shift+click is used

| Field          | Value                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-020                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                               |
| Priority       | High                                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                                   |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                           |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"selects the notes between the last clicked note and the clicked one when Shift+click is used"` |
| Run            | `npx playwright test --grep @NOTES-020` (from `basalt-app/`)                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                     |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Ideas` is selected
When the owner Shift+clicks `Todo`
Then `Ideas`, `Notes`, `Todo` are selected

## Steps observed in the app

| #   | Action           | Observed result |
| --- | ---------------- | --------------- |
| 1   | Shift+click Todo | Range selected  |

## Related cases

NOTES-021.
