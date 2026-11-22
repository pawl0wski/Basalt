# NOTES-056 — Disables Create folder, shows the separator message inline and creates nothing when the folder name contains a slash

| Field          | Value                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-056                                                                                                                                                                                                        |
| Status         | Active                                                                                                                                                                                                           |
| Priority       | Medium                                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                                               |
| Requirement    | [AC-04.3](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                                        |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"disables Create folder, shows the separator message inline and creates nothing when the folder name contains a slash"` |
| Run            | `npx playwright test --grep @NOTES-056` (from `basalt-app/`)                                                                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                                                                 |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner types `a/b` as the folder name
Then the dialog shows `A name cannot contain / or \\.`
And Create folder is disabled, Enter keeps the dialog open and no directory is added

## Steps observed in the app

| #   | Action      | Observed result          |
| --- | ----------- | ------------------------ |
| 1   | Type a/b    | Message; button disabled |
| 2   | Press Enter | Dialog stays             |

## Related cases

NOTES-057.
