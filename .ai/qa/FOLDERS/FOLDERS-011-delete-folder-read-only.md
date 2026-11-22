# FOLDERS-011 — Shows the read-only message and keeps the folder when a folder is deleted in a read-only workspace

| Field          | Value                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | FOLDERS-011                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                               |
| Priority       | High                                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                                   |
| Requirement    | [AC-05.8](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                                          |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"shows the read-only message and keeps the folder when a folder is deleted in a read-only workspace"` |
| Run            | `npx playwright test --grep @FOLDERS-011` (from `basalt-app/`)                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                     |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
And the workspace becomes read-only after opening
When the owner confirms Delete on `archive`
Then the read-only message is shown
And `archive` still exists

## Steps observed in the app

| #   | Action         | Observed result      |
| --- | -------------- | -------------------- |
| 1   | Confirm delete | Message; folder kept |

## Related cases

FOLDERS-008.
