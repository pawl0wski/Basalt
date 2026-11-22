# STATUSBAR-006 — Shows the word count of the active tab when the tab is switched

| Field          | Value                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-006                                                                                                                                           |
| Status         | Active                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                  |
| Type           | UI                                                                                                                                                      |
| Requirement    | [AC-07.1](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                                  |
| Implementation | [`basalt-app/e2e/status-bar.spec.ts`](../../../basalt-app/e2e/status-bar.spec.ts) — `"shows the word count of the active tab when the tab is switched"` |
| Run            | `npx playwright test --grep @STATUSBAR-006` (from `basalt-app/`)                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                        |

## Scenario

Given notes `a` (1 word) and `b` (3 words) are open as tabs
When the owner switches from `b` to `a`
Then the bar reads `3 words` before and `1 word` after

## Steps observed in the app

| #   | Action       | Observed result |
| --- | ------------ | --------------- |
| 1   | Open a, b    | 3 words         |
| 2   | Select tab a | 1 word          |

## Related cases

STATUSBAR-003.
