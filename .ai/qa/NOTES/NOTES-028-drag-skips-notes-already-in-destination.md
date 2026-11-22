# NOTES-028 — Skips selected notes already in the destination and moves the others without an error

| Field          | Value                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-028                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                        |
| Priority       | Medium                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                            |
| Requirement    | [AC-04.13](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) (notes already in the destination are skipped)                                                     |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"skips selected notes already in the destination and moves the others without an error"` |
| Run            | `npx playwright test --grep @NOTES-028` (from `basalt-app/`)                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                              |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Roadmap` and `Ideas` are selected
When the owner drags `Ideas` onto `projects`
Then `Ideas` moves, `Roadmap` stays, other files are unchanged and no alert appears

## Steps observed in the app

| #   | Action | Observed result       |
| --- | ------ | --------------------- |
| 1   | Drag   | Ideas moved; no alert |

## Related cases

NOTES-029.
