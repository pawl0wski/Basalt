# NOTES-069 — Asks with the note name and Cancel focused and removes the note and its tab when Delete is confirmed

| Field          | Value                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-069                                                                                                                                                                                        |
| Status         | Active                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                               |
| Requirement    | [AC-04.2](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                        |
| Implementation | [`basalt-app/e2e/delete-notes.spec.ts`](../../../basalt-app/e2e/delete-notes.spec.ts) — `"asks with the note name and Cancel focused and removes the note and its tab when Delete is confirmed"` |
| Run            | `npx playwright test --grep @NOTES-069` (from `basalt-app/`)                                                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                                                 |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and `projects/Roadmap`
And `Ideas` is open
When the owner chooses Delete in the `Ideas` menu and confirms
Then the dialog is named `Delete "Ideas"?` and has Cancel focused
And after confirming the dialog closes, `Ideas.md` is gone, the tab and the row are gone

## Steps observed in the app

| #   | Action        | Observed result              |
| --- | ------------- | ---------------------------- |
| 1   | Choose Delete | Confirmation, Cancel focused |
| 2   | Confirm       | Note, tab and row removed    |

## Related cases

NOTES-070, NOTES-071. Trash on the real OS is not covered (see PLATFORM).
