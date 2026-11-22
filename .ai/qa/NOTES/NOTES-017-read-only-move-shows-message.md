# NOTES-017 — Shows the read-only message and changes nothing when a note is dragged in a read-only workspace

| Field          | Value                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-017                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                                      |
| Requirement    | [AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                               |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"shows the read-only message and changes nothing when a note is dragged in a read-only workspace"` |
| Run            | `npx playwright test --grep @NOTES-017` (from `basalt-app/`)                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                        |

## Scenario

Given a read-only workspace with the standard notes
When the owner drops `Ideas` on `projects`
Then the read-only message is shown
And no file changed and `Ideas` is still at depth 1

## Steps observed in the app

| #   | Action                   | Observed result    |
| --- | ------------------------ | ------------------ |
| 1   | Drag Ideas onto projects | Message; unchanged |

## Related cases

NOTES-030, TOASTS-010.
