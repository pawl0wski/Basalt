# NOTES-068 — Shows the read-only message in the Rename dialog and changes nothing in a read-only workspace

| Field          | Value                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-068                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                        |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md), [AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                      |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"shows the read-only message in the Rename dialog and changes nothing in a read-only workspace"` |
| Run            | `npx playwright test --grep @NOTES-068` (from `basalt-app/`)                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                          |

## Scenario

Given a read-only workspace with the standard notes
When the owner renames `Ideas` to `Other`
Then the dialog shows the read-only message
And the files are unchanged

## Steps observed in the app

| #   | Action       | Observed result              |
| --- | ------------ | ---------------------------- |
| 1   | Submit Other | Message in dialog; unchanged |

## Related cases

NOTES-051.
