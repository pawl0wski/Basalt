# NOTES-013 — Ignores a drop of a root note on the root area with no file change and no error

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-013                                                                                                                                                               |
| Status         | Active                                                                                                                                                                  |
| Priority       | Low                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                      |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                               |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"ignores a drop of a root note on the root area with no file change and no error"` |
| Run            | `npx playwright test --grep @NOTES-013` (from `basalt-app/`)                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                        |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When `Ideas` is dropped on the root area
Then the files are unchanged and no alert appears

## Steps observed in the app

| #   | Action                            | Observed result |
| --- | --------------------------------- | --------------- |
| 1   | Drag Ideas over the root and drop | Unchanged       |

## Related cases

NOTES-008.
