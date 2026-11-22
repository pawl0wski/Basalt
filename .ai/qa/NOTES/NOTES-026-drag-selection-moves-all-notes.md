# NOTES-026 — Moves every selected note and its open tab when one selected note is dragged to a folder

| Field          | Value                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-026                                                                                                                                                                        |
| Status         | Active                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                               |
| Requirement    | [AC-04.13](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                       |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"moves every selected note and its open tab when one selected note is dragged to a folder"` |
| Run            | `npx playwright test --grep @NOTES-026` (from `basalt-app/`)                                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                                 |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Todo` is open and `Ideas`, `Todo` are selected
When the owner drags `Ideas` onto `projects`
Then both selected rows are marked as dragging and `Notes` is not
And `Ideas` and `Todo` are moved into `projects`
And the `Todo` tab follows and stays selected, and `projects/Todo.md` holds `todo`

## Steps observed in the app

| #   | Action                | Observed result         |
| --- | --------------------- | ----------------------- |
| 1   | Ctrl+click both, drag | Both dragging           |
| 2   | Drop on projects      | Both moved; tab follows |

## Related cases

NOTES-027.
