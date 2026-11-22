# NOTES-027 — Moves only the dragged note and clears the selection when an unselected note is dragged

| Field          | Value                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-027                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                              |
| Requirement    | [AC-04.13](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                      |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"moves only the dragged note and clears the selection when an unselected note is dragged"` |
| Run            | `npx playwright test --grep @NOTES-027` (from `basalt-app/`)                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Ideas` and `Todo` are selected
When the owner drags the unselected `Notes` onto `projects`
Then only `Notes` is moved and the selection is cleared

## Steps observed in the app

| #   | Action                   | Observed result                |
| --- | ------------------------ | ------------------------------ |
| 1   | Drag Notes onto projects | Only Notes moved; no selection |

## Related cases

NOTES-026.
