# NOTES-055 — Closes the dialog, shows an already-exists toast and creates nothing when a new folder name differs only by case from an existing folder

| Field          | Value                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-055                                                                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                                                               |
| Priority       | Medium                                                                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                                                                   |
| Requirement    | [AC-04.3](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) and [AC-08.1](../../specs/2026-11-17-informational-toasts.md)                                                                                              |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"closes the dialog, shows an already-exists toast and creates nothing when a new folder name differs only by case from an existing folder"` |
| Run            | `npx playwright test --grep @NOTES-055` (from `basalt-app/`)                                                                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                     |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner creates a folder whose name differs only by case from an existing one
Then the dialog closes, a toast says it already exists and no directory is added

## Steps observed in the app

| #   | Action          | Observed result              |
| --- | --------------- | ---------------------------- |
| 1   | Submit the name | Toast; directories unchanged |

## Related cases

NOTES-056, NOTES-057.
