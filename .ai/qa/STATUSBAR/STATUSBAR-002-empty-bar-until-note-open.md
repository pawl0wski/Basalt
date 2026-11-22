# STATUSBAR-002 — Shows an empty status bar until a note is open and then its word count

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-002                                                                                                                                                  |
| Status         | Active                                                                                                                                                         |
| Priority       | High                                                                                                                                                           |
| Type           | UI                                                                                                                                                             |
| Requirement    | [AC-07.3 and AC-07.1](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                             |
| Implementation | [`basalt-app/e2e/status-bar.spec.ts`](../../../basalt-app/e2e/status-bar.spec.ts) — `"shows an empty status bar until a note is open and then its word count"` |
| Run            | `npx playwright test --grep @STATUSBAR-002` (from `basalt-app/`)                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                               |

## Scenario

Given a workspace with note `a` containing `one two` is open and no note is open
When the owner opens `a`
Then the status bar is visible and empty before
And it reads `2 words` after

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Open the workspace | Bar empty       |
| 2   | Open a             | `2 words`       |

## Related cases

STATUSBAR-003.
