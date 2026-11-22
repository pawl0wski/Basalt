# NOTES-023 — Clears the selection when Escape is pressed

| Field          | Value                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-023                                                                                                                           |
| Status         | Active                                                                                                                              |
| Priority       | Medium                                                                                                                              |
| Type           | UI                                                                                                                                  |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                          |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"clears the selection when Escape is pressed"` |
| Run            | `npx playwright test --grep @NOTES-023` (from `basalt-app/`)                                                                        |
| Review         | AI draft — awaiting human review                                                                                                    |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And two notes are selected
When the owner presses Escape
Then no note is selected

## Steps observed in the app

| #   | Action       | Observed result |
| --- | ------------ | --------------- |
| 1   | Press Escape | Empty selection |

## Related cases

NOTES-018.
