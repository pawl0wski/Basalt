# NOTES-010 — Opens a collapsed folder after the hover delay while a note is dragged over it

| Field          | Value                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-010                                                                                                                                                              |
| Status         | Active                                                                                                                                                                 |
| Priority       | Medium                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                     |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                       |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"opens a collapsed folder after the hover delay while a note is dragged over it"` |
| Run            | `npx playwright test --grep @NOTES-010` (from `basalt-app/`)                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                       |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And the clock is frozen
When a note is dragged over the collapsed `projects` row for 600 ms
Then the folder is collapsed at first and expanded afterwards, showing `Roadmap`

## Steps observed in the app

| #   | Action             | Observed result     |
| --- | ------------------ | ------------------- |
| 1   | Drag over projects | aria-expanded false |
| 2   | Advance 600 ms     | aria-expanded true  |

## Related cases

Blocker: the hover-open behaviour is not in a spec. NOTES-011.
