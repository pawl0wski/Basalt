# FOLDERS-004 — Renames the directory when only the case of the folder's own name is changed

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-004                                                                                                                                                    |
| Status         | Active                                                                                                                                                         |
| Priority       | Medium                                                                                                                                                         |
| Type           | UI                                                                                                                                                             |
| Requirement    | [AC-05.1](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                    |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"renames the directory when only the case of the folder's own name is changed"` |
| Run            | `npx playwright test --grep @FOLDERS-004` (from `basalt-app/`)                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                               |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
When the owner renames `projects` to `Projects`
Then the dialog closes and the files are under `Projects/`

## Steps observed in the app

| #   | Action          | Observed result |
| --- | --------------- | --------------- |
| 1   | Submit Projects | Renamed         |

## Related cases

FOLDERS-003.
