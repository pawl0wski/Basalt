# NOTES-065 — Renames the file when only the case of the note's own name is changed

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-065                                                                                                                                                         |
| Status         | Active                                                                                                                                                            |
| Priority       | Medium                                                                                                                                                            |
| Type           | UI                                                                                                                                                                |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                         |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"renames the file when only the case of the note's own name is changed"` |
| Run            | `npx playwright test --grep @NOTES-065` (from `basalt-app/`)                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                  |

## Scenario

Given note `ideas` containing `keep` exists
When the owner renames it to `Ideas`
Then the dialog closes and the only file is `Ideas.md`
And it holds `# Ideas\n\nkeep`

## Steps observed in the app

| #   | Action          | Observed result                      |
| --- | --------------- | ------------------------------------ |
| 1   | Rename to Ideas | Dialog closed; Ideas.md with heading |

## Related cases

NOTES-062.
