# NOTES-008 — Moves a nested note to the workspace root when it is dropped on the empty sidebar area

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-008                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-04.13](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) (or the workspace root)                                                                             |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"moves a nested note to the workspace root when it is dropped on the empty sidebar area"` |
| Run            | `npx playwright test --grep @NOTES-008` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given a nested note `projects/Roadmap` exists
When the owner drops it on the empty area of the sidebar
Then the note is moved to the workspace root

## Steps observed in the app

| #   | Action                         | Observed result |
| --- | ------------------------------ | --------------- |
| 1   | Drag Roadmap to the empty area | Moved to root   |

## Related cases

NOTES-013 (root note on the root area is ignored).
