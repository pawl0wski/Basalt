# FOLDERS-005 — Shows the reserved-name message and keeps the folder when a folder is renamed to attachments

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | FOLDERS-005                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                         |
| Priority       | Medium                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-05.5](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                                    |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"shows the reserved-name message and keeps the folder when a folder is renamed to attachments"` |
| Run            | `npx playwright test --grep @FOLDERS-005` (from `basalt-app/`)                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
When the owner types `attachments` as the new name and presses Enter
Then the dialog shows `This name is reserved for attachments.`
And `projects` still exists

## Steps observed in the app

| #   | Action           | Observed result       |
| --- | ---------------- | --------------------- |
| 1   | Type attachments | Reserved message      |
| 2   | Press Enter      | Directories unchanged |

## Related cases

IMAGES scenarios cover the attachments folder itself.
