# NOTES-024 — Opens only the clicked note and replaces the selection with it when a note is clicked without modifiers

| Field          | Value                                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-024                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                              |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                      |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"opens only the clicked note and replaces the selection with it when a note is clicked without modifiers"` |
| Run            | `npx playwright test --grep @NOTES-024` (from `basalt-app/`)                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Notes` and `Ideas` are selected
When the owner clicks `Todo` and then Ctrl+clicks `Ideas`
Then only the `Todo` tab is open and `Todo` is the only selected row
And after the Ctrl+click only `Ideas` is selected

## Steps observed in the app

| #   | Action           | Observed result             |
| --- | ---------------- | --------------------------- |
| 1   | Click Todo       | One tab; only Todo selected |
| 2   | Ctrl+click Ideas | Only Ideas selected         |

## Related cases

NOTES-018.
