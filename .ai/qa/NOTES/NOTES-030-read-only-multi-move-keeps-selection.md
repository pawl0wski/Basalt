# NOTES-030 — Shows the read-only message and keeps the selection when a selection is dragged in a read-only workspace

| Field          | Value                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-030                                                                                                                                                                                        |
| Status         | Active                                                                                                                                                                                           |
| Priority       | Medium                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                               |
| Requirement    | [AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) and [AC-04.13](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                         |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"shows the read-only message and keeps the selection when a selection is dragged in a read-only workspace"` |
| Run            | `npx playwright test --grep @NOTES-030` (from `basalt-app/`)                                                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                                                 |

## Scenario

Given a read-only workspace with `Ideas` and `Todo` selected
When the owner drags `Ideas` onto `projects`
Then the read-only message is shown
And no file changed and the selection is kept

## Steps observed in the app

| #   | Action | Observed result                    |
| --- | ------ | ---------------------------------- |
| 1   | Drag   | Message; unchanged; selection kept |

## Related cases

NOTES-017.
