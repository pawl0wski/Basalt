# NOTES-032 — Clears the selection and offers Rename and Delete when the context menu is opened on an unselected note

| Field          | Value                                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-032                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                          |
| Priority       | Medium                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                              |
| Requirement    | [AC-04.11](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                      |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"clears the selection and offers Rename and Delete when the context menu is opened on an unselected note"` |
| Run            | `npx playwright test --grep @NOTES-032` (from `basalt-app/`)                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Ideas` and `Todo` are selected
When the owner opens the context menu on `Notes`
Then the menu offers `Rename` and `Delete`
And the selection is cleared

## Steps observed in the app

| #   | Action            | Observed result           |
| --- | ----------------- | ------------------------- |
| 1   | Right-click Notes | Normal menu; no selection |

## Related cases

NOTES-031.
