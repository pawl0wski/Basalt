# STATUSBAR-003 — Updates the word count with every typed change in the open note

| Field          | Value                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-003                                                                                                                                           |
| Status         | Active                                                                                                                                                  |
| Priority       | High                                                                                                                                                    |
| Type           | UI                                                                                                                                                      |
| Requirement    | [AC-07.1](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                                  |
| Implementation | [`basalt-app/e2e/status-bar.spec.ts`](../../../basalt-app/e2e/status-bar.spec.ts) — `"updates the word count with every typed change in the open note"` |
| Run            | `npx playwright test --grep @STATUSBAR-003` (from `basalt-app/`)                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                        |

## Scenario

Given an empty note `a` is open
When the owner types `hello` and then ` brave new world`
Then the bar reads `0 words`, then `1 word`, then `4 words`

## Steps observed in the app

| #   | Action     | Observed result |
| --- | ---------- | --------------- |
| 1   | Open a     | 0 words         |
| 2   | Type hello | 1 word          |
| 3   | Type more  | 4 words         |

## Related cases

STATUSBAR-004.
