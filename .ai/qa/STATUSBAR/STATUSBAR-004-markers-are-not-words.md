# STATUSBAR-004 — Counts zero words for bare Markdown markers and one word once a word is typed

| Field          | Value                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-004                                                                                                                                                         |
| Status         | Active                                                                                                                                                                |
| Priority       | Medium                                                                                                                                                                |
| Type           | UI                                                                                                                                                                    |
| Requirement    | [AC-07.6](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                                                |
| Implementation | [`basalt-app/e2e/status-bar.spec.ts`](../../../basalt-app/e2e/status-bar.spec.ts) — `"counts zero words for bare Markdown markers and one word once a word is typed"` |
| Run            | `npx playwright test --grep @STATUSBAR-004` (from `basalt-app/`)                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                      |

## Scenario

Given a note containing only Markdown markers is open
When the owner types `item`
Then the bar reads `0 words` before and `1 word` after

## Steps observed in the app

| #   | Action    | Observed result |
| --- | --------- | --------------- |
| 1   | Open a    | 0 words         |
| 2   | Type item | 1 word          |

## Related cases

STATUSBAR-003.
