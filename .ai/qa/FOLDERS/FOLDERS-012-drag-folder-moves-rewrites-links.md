# FOLDERS-012 — Moves the folder, rewrites its notes' links, moves open tabs and keeps the target expanded when a folder is dragged onto another folder

| Field          | Value                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-012                                                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                                        |
| Requirement    | [AC-05.2](../../specs/implemented/2026-11-16-rename-move-delete-folders.md), [AC-05.7](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                  |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"moves the folder, rewrites its notes' links, moves open tabs and keeps the target expanded when a folder is dragged onto another folder"` |
| Run            | `npx playwright test --grep @FOLDERS-012` (from `basalt-app/`)                                                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                                                          |

## Scenario

Given a workspace with `Ideas`, folders `projects` (holding `Roadmap` and `2026/Plan`) and `archive` (holding `Old`)
And `Plan` (linking `../Roadmap.md`) is open
When the owner drags `2026` onto `archive`
Then `archive/2026/Plan.md` exists and `projects/2026/Plan.md` does not
And the tab `Plan` stays and the note links `../../projects/Roadmap.md`
And `archive` is expanded and `2026` is the focus target

## Steps observed in the app

| #   | Action                 | Observed result                 |
| --- | ---------------------- | ------------------------------- |
| 1   | Drag 2026 onto archive | Moved; link rewritten; tab kept |

## Related cases

FOLDERS-013, FOLDERS-014.
