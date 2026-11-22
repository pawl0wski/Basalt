# NOTES-041 — Offers New note, New folder, Rename and Delete when the context menu is opened on a folder

| Field          | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-041                                                                                                                                                                              |
| Status         | Active                                                                                                                                                                                 |
| Priority       | High                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                     |
| Requirement    | [AC-04.9](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                              |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"offers New note, New folder, Rename and Delete when the context menu is opened on a folder"` |
| Run            | `npx playwright test --grep @NOTES-041` (from `basalt-app/`)                                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                                       |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner right-clicks a folder
Then the menu offers `New note`, `New folder`, `Rename` and `Delete`

## Steps observed in the app

| #   | Action               | Observed result |
| --- | -------------------- | --------------- |
| 1   | Right-click projects | Four items      |

## Related cases

NOTES-040.
