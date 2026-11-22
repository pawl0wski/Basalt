# STATUSBAR-007 — Keeps the word count and shows no save wording while saving fails and after Retry succeeds

| Field          | Value                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-007                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                             |
| Priority       | High                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                 |
| Requirement    | [AC-07.4, AC-07.5](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                                                    |
| Implementation | [`basalt-app/e2e/status-bar.spec.ts`](../../../basalt-app/e2e/status-bar.spec.ts) — `"keeps the word count and shows no save wording while saving fails and after Retry succeeds"` |
| Run            | `npx playwright test --grep @STATUSBAR-007` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                                   |

## Scenario

Given a read-only workspace with note `a` containing `base` is open
And the clock is frozen
When the owner types ` more`, the autosave delay passes, the workspace becomes writable and Retry is chosen
Then while saving fails the alert is shown, the tab is `a not saved` and the bar reads `2 words` without save wording
And after Retry the tab is `a`, the file holds `base more` and the bar still reads `2 words`

## Steps observed in the app

| #   | Action                 | Observed result                |
| --- | ---------------------- | ------------------------------ |
| 1   | Type, advance 1 000 ms | Alert; bar 2 words             |
| 2   | Make writable, Retry   | Tab a; file saved; bar 2 words |

## Related cases

STATUSBAR-001, SAVING-003, SAVING-005.
