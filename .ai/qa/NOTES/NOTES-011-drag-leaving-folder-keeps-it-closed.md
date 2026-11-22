# NOTES-011 — Keeps a collapsed folder closed when the drag leaves it before the hover delay passes

| Field          | Value                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-011                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                        |
| Priority       | Medium                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                            |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                              |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"keeps a collapsed folder closed when the drag leaves it before the hover delay passes"` |
| Run            | `npx playwright test --grep @NOTES-011` (from `basalt-app/`)                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                              |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And the clock is frozen
When a note is dragged over `projects` and then over `Todo`, and 900 ms pass
Then `projects` is still collapsed

## Steps observed in the app

| #   | Action                                        | Observed result |
| --- | --------------------------------------------- | --------------- |
| 1   | Drag over projects, then Todo, advance 900 ms | Collapsed       |

## Related cases

NOTES-010.
