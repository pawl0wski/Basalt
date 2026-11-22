# NOTES-012 — Ignores a drop on the note's own folder with no highlight, no file change and no error

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-012                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                         |
| Priority       | Medium                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                      |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"ignores a drop on the note's own folder with no highlight, no file change and no error"` |
| Run            | `npx playwright test --grep @NOTES-012` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `projects` is expanded
When a note of `projects` is dropped on `projects`
Then the row is not marked as a drop target
And the files are unchanged and no alert appears
And the note is still at depth 2

## Steps observed in the app

| #   | Action                     | Observed result           |
| --- | -------------------------- | ------------------------- |
| 1   | Drag Roadmap over projects | Not marked                |
| 2   | Drop                       | Files unchanged; no alert |

## Related cases

NOTES-013.
