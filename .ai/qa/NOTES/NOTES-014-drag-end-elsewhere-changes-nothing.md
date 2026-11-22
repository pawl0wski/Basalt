# NOTES-014 — Changes nothing and clears the highlight when a drag ends outside any drop target

| Field          | Value                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-014                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                    |
| Priority       | Medium                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                        |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                 |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"changes nothing and clears the highlight when a drag ends outside any drop target"` |
| Run            | `npx playwright test --grep @NOTES-014` (from `basalt-app/`)                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                          |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When a drag over `projects` ends without a drop
Then no file changes
And the highlight is cleared, `Ideas` is no longer marked as dragged and a later dragover does not highlight

## Steps observed in the app

| #   | Action                           | Observed result               |
| --- | -------------------------------- | ----------------------------- |
| 1   | Drag over projects, end the drag | Files unchanged; no highlight |

## Related cases

NOTES-009.
