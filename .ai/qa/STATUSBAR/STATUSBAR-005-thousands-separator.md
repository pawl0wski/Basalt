# STATUSBAR-005 — Shows the word count with a thousands separator for a long note

| Field          | Value                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-005                                                                                                                                           |
| Status         | Active                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                  |
| Type           | UI                                                                                                                                                      |
| Requirement    | [AC-07.1](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                                  |
| Implementation | [`basalt-app/e2e/status-bar.spec.ts`](../../../basalt-app/e2e/status-bar.spec.ts) — `"shows the word count with a thousands separator for a long note"` |
| Run            | `npx playwright test --grep @STATUSBAR-005` (from `basalt-app/`)                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                        |

## Scenario

Given a note with 1 204 words is open
When the note is shown
Then the bar reads `1,204 words`

## Steps observed in the app

| #   | Action | Observed result |
| --- | ------ | --------------- |
| 1   | Open a | 1,204 words     |

## Related cases

STATUSBAR-003.
