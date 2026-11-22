# NOTES-070 — Keeps the note, its file and its tab when Cancel is chosen in the delete confirmation

| Field          | Value                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-070                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                            |
| Priority       | High                                                                                                                                                                              |
| Type           | UI                                                                                                                                                                                |
| Requirement    | [AC-04.2](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) (Cancel has no effect)                                                                                  |
| Implementation | [`basalt-app/e2e/delete-notes.spec.ts`](../../../basalt-app/e2e/delete-notes.spec.ts) — `"keeps the note, its file and its tab when Cancel is chosen in the delete confirmation"` |
| Run            | `npx playwright test --grep @NOTES-070` (from `basalt-app/`)                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                  |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and `projects/Roadmap`
And `Ideas` is open
When the owner chooses Delete and then Cancel
Then the dialog closes
And the files are unchanged and the `Ideas` tab is still open

## Steps observed in the app

| #   | Action        | Observed result |
| --- | ------------- | --------------- |
| 1   | Choose Delete | Confirmation    |
| 2   | Cancel        | Unchanged       |

## Related cases

NOTES-069.
