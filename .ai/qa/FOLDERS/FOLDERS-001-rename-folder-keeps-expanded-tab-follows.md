# FOLDERS-001 — Renames the directory, keeps it expanded and moves the open tab of a note inside to the new path when a folder is renamed

| Field          | Value                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-001                                                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                                                                |
| Priority       | High                                                                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                                                                    |
| Requirement    | [AC-05.1](../../specs/implemented/2026-11-16-rename-move-delete-folders.md), [AC-05.5](../../specs/implemented/2026-11-16-rename-move-delete-folders.md), [AC-05.7](../../specs/implemented/2026-11-16-rename-move-delete-folders.md) |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"renames the directory, keeps it expanded and moves the open tab of a note inside to the new path when a folder is renamed"`                           |
| Run            | `npx playwright test --grep @FOLDERS-001` (from `basalt-app/`)                                                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                      |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
And `Roadmap` is open in a tab
When the owner renames `projects` to `Work`
Then the files are under `Work/` and the others are unchanged
And `Work` is expanded and shows `Roadmap`
And the tab `Roadmap` stays and still shows `road`

## Steps observed in the app

| #   | Action                  | Observed result                |
| --- | ----------------------- | ------------------------------ |
| 1   | Rename projects to Work | Directory renamed; tab follows |

## Related cases

FOLDERS-002 (saving afterwards), FOLDERS-006.
