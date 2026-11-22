# NOTES-036 — Expands the folders of a note when the note is opened

| Field          | Value                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-036                                                                                                                                         |
| Status         | Active                                                                                                                                            |
| Priority       | Medium                                                                                                                                            |
| Type           | UI                                                                                                                                                |
| Requirement    | [AC-04.6](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                         |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"expands the folders of a note when the note is opened"` |
| Run            | `npx playwright test --grep @NOTES-036` (from `basalt-app/`)                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                  |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When a nested note is opened
Then the folders on its path are expanded

## Steps observed in the app

| #   | Action    | Observed result            |
| --- | --------- | -------------------------- |
| 1   | Open Plan | projects and 2026 expanded |

## Related cases

NOTES-035.
