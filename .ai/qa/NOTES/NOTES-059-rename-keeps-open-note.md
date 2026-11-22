# NOTES-059 — Renames the file on disk and keeps the open note, its text and its tab when a note is renamed

| Field          | Value                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-059                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                        |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                 |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"renames the file on disk and keeps the open note, its text and its tab when a note is renamed"` |
| Run            | `npx playwright test --grep @NOTES-059` (from `basalt-app/`)                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                          |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And `Roadmap` is open showing `road`
When the owner renames it to `Plan B`
Then the file is `projects/Plan B.md` and the other files are unchanged
And the only tab is `Plan B`, selected, showing `road`
And the row is current and focused

## Steps observed in the app

| #   | Action           | Observed result                          |
| --- | ---------------- | ---------------------------------------- |
| 1   | Rename to Plan B | Dialog closed; file renamed; tab follows |

## Related cases

NOTES-060.
