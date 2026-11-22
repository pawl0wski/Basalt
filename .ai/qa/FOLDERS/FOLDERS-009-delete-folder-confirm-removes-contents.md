# FOLDERS-009 — Asks once, states that the contents go to the trash and removes the folder and its tabs when Delete is confirmed

| Field          | Value                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-009                                                                                                                                                                                        |
| Status         | Active                                                                                                                                                                                             |
| Priority       | High                                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                                 |
| Requirement    | [AC-05.3](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                                                        |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"asks once, states that the contents go to the trash and removes the folder and its tabs when Delete is confirmed"` |
| Run            | `npx playwright test --grep @FOLDERS-009` (from `basalt-app/`)                                                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                                                   |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
And `Roadmap` is open
When the owner chooses Delete on `projects` and confirms
Then the dialog is named `Delete "projects"?` and says the folder and everything in it go to the trash
And after confirming only `Ideas.md` and `archive/Old.md` remain, no tab is open and no `projects` row exists

## Steps observed in the app

| #   | Action        | Observed result          |
| --- | ------------- | ------------------------ |
| 1   | Choose Delete | Confirmation             |
| 2   | Confirm       | Folder gone; tabs closed |

## Related cases

FOLDERS-010. AC-05.4 (unsaved notes inside) has Vitest only.
