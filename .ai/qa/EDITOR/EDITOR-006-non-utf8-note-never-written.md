# EDITOR-006 — Shows the not-UTF-8 message and never writes the file when a note with invalid bytes is opened and typed into

| Field          | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-006                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                            |
| Requirement    | [AC-01.15](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                      |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"shows the not-UTF-8 message and never writes the file when a note with invalid bytes is opened and typed into"` |
| Run            | `npx playwright test --grep @EDITOR-006` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                              |

## Scenario

Given a workspace with a note containing invalid UTF-8 bytes
And the clock is frozen
When the owner opens it, types, and 2 000 ms pass
Then the not-UTF-8 message is shown and no editor is mounted
And the file bytes are unchanged

## Steps observed in the app

| #   | Action                    | Observed result    |
| --- | ------------------------- | ------------------ |
| 1   | Open bin                  | Message; no editor |
| 2   | Type and advance 2 000 ms | Bytes unchanged    |

## Related cases

EDITOR-005. Symlink and unknown read error have Vitest only (see spec implementation status).
