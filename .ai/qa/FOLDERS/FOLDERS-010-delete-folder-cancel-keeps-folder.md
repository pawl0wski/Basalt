# FOLDERS-010 — Keeps the folder when Cancel is chosen in the delete confirmation

| Field          | Value                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-010                                                                                                                                         |
| Status         | Active                                                                                                                                              |
| Priority       | High                                                                                                                                                |
| Type           | UI                                                                                                                                                  |
| Requirement    | [AC-05.3](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                         |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"keeps the folder when Cancel is chosen in the delete confirmation"` |
| Run            | `npx playwright test --grep @FOLDERS-010` (from `basalt-app/`)                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                    |

## Scenario

Given a folder `keep` holds a note
When the owner chooses Delete and then Cancel
Then the folder still exists

## Steps observed in the app

| #   | Action        | Observed result |
| --- | ------------- | --------------- |
| 1   | Choose Delete | Alert dialog    |
| 2   | Cancel        | Folder remains  |

## Related cases

FOLDERS-009.
