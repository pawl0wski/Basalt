# NOTES-039 — Indents each nested row further than its parent

| Field          | Value                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-039                                                                                                                                   |
| Status         | Active                                                                                                                                      |
| Priority       | Medium                                                                                                                                      |
| Type           | UI                                                                                                                                          |
| Requirement    | [AC-04.8](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                   |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"indents each nested row further than its parent"` |
| Run            | `npx playwright test --grep @NOTES-039` (from `basalt-app/`)                                                                                |
| Review         | AI draft — awaiting human review                                                                                                            |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And `projects` and `2026` are expanded
When row label positions are measured
Then `2026` starts further right than `projects` and `Plan` further right than `2026`

## Steps observed in the app

| #   | Action                    | Observed result        |
| --- | ------------------------- | ---------------------- |
| 1   | Measure label x positions | Increasing indentation |

## Related cases

NOTES-038.
