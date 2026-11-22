# NOTES-035 — Opens a nested note in a tab and an editor when it is chosen in its expanded folder

| Field          | Value                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-035                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                              |
| Requirement    | [AC-04.6](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                       |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"opens a nested note in a tab and an editor when it is chosen in its expanded folder"` |
| Run            | `npx playwright test --grep @NOTES-035` (from `basalt-app/`)                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And `projects` is expanded
When the owner chooses `Roadmap`
Then a tab `Roadmap` opens and its editor shows `road`

## Steps observed in the app

| #   | Action         | Observed result |
| --- | -------------- | --------------- |
| 1   | Choose Roadmap | Tab and editor  |

## Related cases

NOTES-036.
