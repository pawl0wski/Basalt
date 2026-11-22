# FOLDERS-013 — Changes nothing when a folder is dropped into itself or into a descendant

| Field          | Value                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-013                                                                                                                                                 |
| Status         | Active                                                                                                                                                      |
| Priority       | Medium                                                                                                                                                      |
| Type           | UI                                                                                                                                                          |
| Requirement    | [AC-05.2](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                 |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"changes nothing when a folder is dropped into itself or into a descendant"` |
| Run            | `npx playwright test --grep @FOLDERS-013` (from `basalt-app/`)                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                            |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
When the owner drops `projects` on `2026` and on itself
Then no file or directory changes and no nested `projects` appears

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Drop on descendant | Unchanged       |
| 2   | Drop on itself     | Unchanged       |

## Related cases

FOLDERS-012.
