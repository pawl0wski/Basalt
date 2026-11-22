# FOLDERS-007 — Offers no Rename or Delete when the context menu is opened on the workspace root

| Field          | Value                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | FOLDERS-007                                                                                                                                                        |
| Status         | Active                                                                                                                                                             |
| Priority       | Medium                                                                                                                                                             |
| Type           | UI                                                                                                                                                                 |
| Requirement    | [AC-05.5](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                        |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"offers no Rename or Delete when the context menu is opened on the workspace root"` |
| Run            | `npx playwright test --grep @FOLDERS-007` (from `basalt-app/`)                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                   |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
When the owner opens the context menu on the workspace root
Then the menu has no `Rename` and no `Delete`

## Steps observed in the app

| #   | Action                        | Observed result     |
| --- | ----------------------------- | ------------------- |
| 1   | Right-click the empty sidebar | No Rename or Delete |

## Related cases

NOTES-042.
