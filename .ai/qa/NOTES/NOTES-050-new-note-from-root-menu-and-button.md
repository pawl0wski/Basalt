# NOTES-050 — Creates the note in the workspace root when New note is chosen from the root menu or the sidebar button

| Field          | Value                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-050                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                              |
| Priority       | Medium                                                                                                                                                                                              |
| Type           | UI                                                                                                                                                                                                  |
| Requirement    | [AC-04.4](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                           |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"creates the note in the workspace root when New note is chosen from the root menu or the sidebar button"` |
| Run            | `npx playwright test --grep @NOTES-050` (from `basalt-app/`)                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                    |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner uses New note from the root menu and from the sidebar button
Then both notes are created in the workspace root

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Root menu New note | Root note       |
| 2   | Sidebar button     | Root note       |

## Related cases

NOTES-048.
