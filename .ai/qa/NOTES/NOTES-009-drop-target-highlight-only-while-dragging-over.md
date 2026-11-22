# NOTES-009 — Highlights a folder only while it is the drop target of a drag

| Field          | Value                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-009                                                                                                                                              |
| Status         | Active                                                                                                                                                 |
| Priority       | Medium                                                                                                                                                 |
| Type           | UI                                                                                                                                                     |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) (the folder row is highlighted while it is the drop target)                  |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"highlights a folder only while it is the drop target of a drag"` |
| Run            | `npx playwright test --grep @NOTES-009` (from `basalt-app/`)                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                       |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When a note is dragged over `projects` and the drag then leaves
Then the folder is marked as drop target only while the note is over it

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Drag over projects | Marked          |
| 2   | Drag leaves        | Not marked      |

## Related cases

NOTES-014.
