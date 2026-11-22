# NOTES-025 — Leaves a folder unselected when it is Ctrl+clicked

| Field          | Value                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-025                                                                                                                                  |
| Status         | Active                                                                                                                                     |
| Priority       | Low                                                                                                                                        |
| Type           | UI                                                                                                                                         |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                 |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"leaves a folder unselected when it is Ctrl+clicked"` |
| Run            | `npx playwright test --grep @NOTES-025` (from `basalt-app/`)                                                                               |
| Review         | AI draft — awaiting human review                                                                                                           |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When the owner Ctrl+clicks `projects`
Then no row is selected and the folder has no selected state

## Steps observed in the app

| #   | Action              | Observed result  |
| --- | ------------------- | ---------------- |
| 1   | Ctrl+click projects | Nothing selected |

## Related cases

NOTES-018.
