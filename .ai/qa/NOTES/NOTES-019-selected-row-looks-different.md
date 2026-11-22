# NOTES-019 — Styles a selected row with a different background than an unselected row

| Field          | Value                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-019                                                                                                                                                        |
| Status         | Active                                                                                                                                                           |
| Priority       | Low                                                                                                                                                              |
| Type           | UI                                                                                                                                                               |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                       |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"styles a selected row with a different background than an unselected row"` |
| Run            | `npx playwright test --grep @NOTES-019` (from `basalt-app/`)                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                 |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When the owner Ctrl+clicks `Ideas`
Then `Ideas` has a different background than `Todo`

## Steps observed in the app

| #   | Action           | Observed result      |
| --- | ---------------- | -------------------- |
| 1   | Ctrl+click Ideas | Different background |

## Related cases

NOTES-018.
