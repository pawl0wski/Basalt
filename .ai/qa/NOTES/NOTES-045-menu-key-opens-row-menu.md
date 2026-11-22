# NOTES-045 — Opens the note menu of the focused row and returns focus to the row on Escape when the Menu key is pressed

| Field          | Value                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-045                                                                                                                                                                                              |
| Status         | Active                                                                                                                                                                                                 |
| Priority       | High                                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                                     |
| Requirement    | [AC-04.9](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                              |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"opens the note menu of the focused row and returns focus to the row on Escape when the Menu key is pressed"` |
| Run            | `npx playwright test --grep @NOTES-045` (from `basalt-app/`)                                                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                                                       |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And the `Ideas` row has focus
When the owner presses the Menu key and then Escape
Then the note menu opens and closes
And focus returns to the `Ideas` row

## Steps observed in the app

| #   | Action   | Observed result          |
| --- | -------- | ------------------------ |
| 1   | Menu key | Note menu                |
| 2   | Escape   | Menu closed; row focused |

## Related cases

NOTES-044.
