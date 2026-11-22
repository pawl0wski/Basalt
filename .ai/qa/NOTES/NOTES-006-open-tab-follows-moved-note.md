# NOTES-006 — Moves the open tab with the note, keeps its text and saves later edits to the new path

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-006                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                      |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"moves the open tab with the note, keeps its text and saves later edits to the new path"` |
| Run            | `npx playwright test --grep @NOTES-006` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And note `Ideas` is open showing `ideas`
And the clock is frozen
When the owner drops `Ideas` on `projects`, types `!` and the autosave delay passes
Then the only tab is still `Ideas`, selected, with the text kept
And the row is current at the new path
And `projects/Ideas.md` holds `ideas!` and `Ideas.md` no longer exists

## Steps observed in the app

| #   | Action                   | Observed result        |
| --- | ------------------------ | ---------------------- |
| 1   | Drag Ideas onto projects | Tab follows; text kept |
| 2   | Type !, advance 1 000 ms | New path holds ideas!  |

## Related cases

NOTES-007.
