# NOTES-007 — Saves the unsaved text before the move when a dirty note is dragged to a folder

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-007                                                                                                                                                               |
| Status         | Active                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                      |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) and the Autosave rule (flush before structural change)                                        |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"saves the unsaved text before the move when a dirty note is dragged to a folder"` |
| Run            | `npx playwright test --grep @NOTES-007` (from `basalt-app/`)                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                        |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Ideas` is open with ` more` typed and not yet autosaved
And the clock is frozen
When the owner drops `Ideas` on `projects`
Then `projects/Ideas.md` holds `ideas more`

## Steps observed in the app

| #   | Action             | Observed result               |
| --- | ------------------ | ----------------------------- |
| 1   | Type more          | Unsaved                       |
| 2   | Drag onto projects | New path holds the typed text |

## Related cases

NOTES-006.
