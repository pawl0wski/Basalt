# FOLDERS-008 — Shows the read-only message in the Rename dialog and keeps the directory when a folder is renamed in a read-only workspace

| Field          | Value                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | FOLDERS-008                                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                                           |
| Requirement    | [AC-05.8](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                                                                  |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"shows the read-only message in the Rename dialog and keeps the directory when a folder is renamed in a read-only workspace"` |
| Run            | `npx playwright test --grep @FOLDERS-008` (from `basalt-app/`)                                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                                             |

## Scenario

Given a read-only workspace with the standard folders
When the owner renames `projects` to `Work`
Then the Rename folder dialog shows the read-only message
And `projects` still exists

## Steps observed in the app

| #   | Action      | Observed result    |
| --- | ----------- | ------------------ |
| 1   | Submit Work | Message; unchanged |

## Related cases

FOLDERS-011, FOLDERS-015.
