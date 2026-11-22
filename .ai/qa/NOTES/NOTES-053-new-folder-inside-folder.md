# NOTES-053 — Creates a folder inside a folder and shows it expanded in view when New folder is chosen from a folder menu

| Field          | Value                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-053                                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                                                      |
| Requirement    | [AC-04.3](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                               |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"creates a folder inside a folder and shows it expanded in view when New folder is chosen from a folder menu"` |
| Run            | `npx playwright test --grep @NOTES-053` (from `basalt-app/`)                                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                                        |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner chooses New folder in the `projects` menu and enters a name
Then the folder is created inside `projects` and shown expanded

## Steps observed in the app

| #   | Action            | Observed result          |
| --- | ----------------- | ------------------------ |
| 1   | Create the folder | Inside projects; visible |

## Related cases

NOTES-052.
