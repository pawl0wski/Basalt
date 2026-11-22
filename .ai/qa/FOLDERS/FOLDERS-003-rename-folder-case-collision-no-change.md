# FOLDERS-003 — Changes no directory when a folder is renamed to a name that differs only by case from another folder

| Field          | Value                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-003                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                         |
| Priority       | Medium                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                             |
| Requirement    | [AC-05.1](../../specs/implemented/2026-11-16-rename-move-delete-folders.md) (a colliding name, including case-only, is rejected) and [AC-08.1](../../specs/2026-11-17-informational-toasts.md) |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"changes no directory when a folder is renamed to a name that differs only by case from another folder"`        |
| Run            | `npx playwright test --grep @FOLDERS-003` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                               |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
When the owner renames `projects` to `ARCHIVE`
Then both `projects` and `archive` still exist

## Steps observed in the app

| #   | Action         | Observed result       |
| --- | -------------- | --------------------- |
| 1   | Submit ARCHIVE | Directories unchanged |

## Related cases

NOTES-062 (note case collision).
