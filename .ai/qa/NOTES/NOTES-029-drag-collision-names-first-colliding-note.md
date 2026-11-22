# NOTES-029 — Moves nothing, keeps the selection and names the first colliding note in a toast when a selected note collides

| Field          | Value                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-029                                                                                                                                                                                              |
| Status         | Active                                                                                                                                                                                                 |
| Priority       | High                                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                                     |
| Requirement    | [AC-04.13](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) and [AC-08.1](../../specs/2026-11-17-informational-toasts.md)                                                               |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"moves nothing, keeps the selection and names the first colliding note in a toast when a selected note collides"` |
| Run            | `npx playwright test --grep @NOTES-029` (from `basalt-app/`)                                                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                                                       |

## Scenario

Given `Ideas`, `Todo`, `Notes` exist and `projects` holds `todo.md` and `NOTES.md`
And `Notes` is open and all three are selected
When the owner drags `Ideas` onto `projects`
Then a toast names `Notes.md` as already existing and nothing is moved
And the sidebar shows no status, the tab `Notes` stays open and three rows stay selected

## Steps observed in the app

| #   | Action             | Observed result                  |
| --- | ------------------ | -------------------------------- |
| 1   | Drag onto projects | Toast; unchanged; selection kept |

## Related cases

NOTES-016.
