# NOTES-021 — Skips folders and counts only visible notes when a Shift+click range crosses an expanded folder

| Field          | Value                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-021                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                      |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                              |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"skips folders and counts only visible notes when a Shift+click range crosses an expanded folder"` |
| Run            | `npx playwright test --grep @NOTES-021` (from `basalt-app/`)                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                        |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `projects` is expanded and `Roadmap` is selected
When the owner Shift+clicks `Todo`
Then `Roadmap`, `Ideas`, `Notes`, `Todo` are selected and no folder is selected

## Steps observed in the app

| #   | Action           | Observed result    |
| --- | ---------------- | ------------------ |
| 1   | Shift+click Todo | Visible notes only |

## Related cases

NOTES-020.
