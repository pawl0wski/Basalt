# NOTES-038 — Gives rows at every depth the same style and height

| Field          | Value                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-038                                                                                                                                       |
| Status         | Active                                                                                                                                          |
| Priority       | Medium                                                                                                                                          |
| Type           | UI                                                                                                                                              |
| Requirement    | [AC-04.8](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                       |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"gives rows at every depth the same style and height"` |
| Run            | `npx playwright test --grep @NOTES-038` (from `basalt-app/`)                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And `projects` and `2026` are expanded
When row styles are measured
Then notes at every depth and folders at every depth share height, font size, weight, colour, radius and display

## Steps observed in the app

| #   | Action                                       | Observed result |
| --- | -------------------------------------------- | --------------- |
| 1   | Measure Ideas, Roadmap, Plan, projects, 2026 | Equal styles    |

## Related cases

NOTES-039.
