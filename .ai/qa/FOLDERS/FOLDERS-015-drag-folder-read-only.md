# FOLDERS-015 — Shows the read-only message and keeps the folder in place when a folder is dragged in a read-only workspace

| Field          | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-015                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                            |
| Requirement    | [AC-05.8](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                                                   |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"shows the read-only message and keeps the folder in place when a folder is dragged in a read-only workspace"` |
| Run            | `npx playwright test --grep @FOLDERS-015` (from `basalt-app/`)                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                              |

## Scenario

Given a read-only workspace with the standard folders
When the owner drags `2026` onto `archive`
Then the read-only message is shown
And `projects/2026/Plan.md` still exists

## Steps observed in the app

| #   | Action                 | Observed result    |
| --- | ---------------------- | ------------------ |
| 1   | Drag 2026 onto archive | Message; unchanged |

## Related cases

FOLDERS-008.
