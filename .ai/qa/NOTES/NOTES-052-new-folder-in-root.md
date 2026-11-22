# NOTES-052 — Creates a folder in the workspace root when New folder is chosen from the root menu

| Field          | Value                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-052                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                              |
| Requirement    | [AC-04.3](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                       |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"creates a folder in the workspace root when New folder is chosen from the root menu"` |
| Run            | `npx playwright test --grep @NOTES-052` (from `basalt-app/`)                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner chooses New folder in the root menu and enters a name
Then the directory exists in the workspace root

## Steps observed in the app

| #   | Action            | Observed result  |
| --- | ----------------- | ---------------- |
| 1   | Create the folder | Directory exists |

## Related cases

NOTES-053.
