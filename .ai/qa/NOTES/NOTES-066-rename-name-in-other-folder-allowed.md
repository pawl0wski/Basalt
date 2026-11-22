# NOTES-066 — Renames the note when the new name exists only in another folder

| Field          | Value                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-066                                                                                                                                                    |
| Status         | Active                                                                                                                                                       |
| Priority       | Medium                                                                                                                                                       |
| Type           | UI                                                                                                                                                           |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                    |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"renames the note when the new name exists only in another folder"` |
| Run            | `npx playwright test --grep @NOTES-066` (from `basalt-app/`)                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                             |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And `projects` is expanded
When the owner renames `Roadmap` to `Ideas`, a name that exists only at the root
Then the dialog closes and `projects/Ideas.md` exists

## Steps observed in the app

| #   | Action          | Observed result                  |
| --- | --------------- | -------------------------------- |
| 1   | Rename to Ideas | Dialog closed; projects/Ideas.md |

## Related cases

NOTES-062.
