# NOTES-022 — Extends the selection down and shrinks it back up when Shift+ArrowDown and Shift+ArrowUp are pressed

| Field          | Value                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-022                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                       |
| Priority       | Medium                                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                                           |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                   |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"extends the selection down and shrinks it back up when Shift+ArrowDown and Shift+ArrowUp are pressed"` |
| Run            | `npx playwright test --grep @NOTES-022` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                             |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
And `Ideas` is selected and focused
When the owner presses Shift+ArrowDown twice and Shift+ArrowUp once
Then the selection grows to `Ideas`, `Notes`, then `Todo` and shrinks back to `Ideas`, `Notes`

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Shift+ArrowDown x2 | Three selected  |
| 2   | Shift+ArrowUp      | Two selected    |

## Related cases

NOTES-020.
