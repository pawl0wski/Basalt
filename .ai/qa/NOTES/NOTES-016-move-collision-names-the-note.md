# NOTES-016 — Shows a toast naming the note and moves nothing when the destination already has that name

| Field          | Value                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-016                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                             |
| Priority       | High                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                 |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) and [AC-08.1](../../specs/2026-11-17-informational-toasts.md)                                            |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"shows a toast naming the note and moves nothing when the destination already has that name"` |
| Run            | `npx playwright test --grep @NOTES-016` (from `basalt-app/`)                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                   |

## Scenario

Given `Ideas.md` exists at the root and `projects/IDEAS.md` exists
When the owner drops `Ideas` on `projects`
Then a toast says `"Ideas.md" already exists in the destination. Nothing was moved.`
And the sidebar shows no status and no file changed

## Steps observed in the app

| #   | Action                   | Observed result        |
| --- | ------------------------ | ---------------------- |
| 1   | Drag Ideas onto projects | Toast; files unchanged |

## Related cases

NOTES-029 (several notes), TOASTS-001.
