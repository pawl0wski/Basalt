# NOTES-034 — Shows folders first and collapsed and a nested note under its folder by its own name when a workspace is opened

| Field          | Value                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-034                                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                                          |
| Requirement    | [AC-04.6](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                                   |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"shows folders first and collapsed and a nested note under its folder by its own name when a workspace is opened"` |
| Run            | `npx playwright test --grep @NOTES-034` (from `basalt-app/`)                                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                                            |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the workspace is opened
Then folders are listed before notes and are collapsed
And the nested note is shown under its folder by its own name, not as `folder/file`

## Steps observed in the app

| #   | Action             | Observed result          |
| --- | ------------------ | ------------------------ |
| 1   | Open the workspace | Folders first; collapsed |
| 2   | Expand projects    | Roadmap shown by name    |

## Related cases

NOTES-036, NOTES-037.
