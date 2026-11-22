# STATUSBAR-008 — Renders the word count outside any live region

| Field          | Value                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-008                                                                                                                          |
| Status         | Active                                                                                                                                 |
| Priority       | Medium                                                                                                                                 |
| Type           | UI                                                                                                                                     |
| Requirement    | [AC-07.8](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                 |
| Implementation | [`basalt-app/e2e/status-bar.spec.ts`](../../../basalt-app/e2e/status-bar.spec.ts) — `"renders the word count outside any live region"` |
| Run            | `npx playwright test --grep @STATUSBAR-008` (from `basalt-app/`)                                                                       |
| Review         | AI draft — awaiting human review                                                                                                       |

## Scenario

Given note `a` containing `one` is open
When the count is inspected
Then the text `1 word` has no ancestor with `aria-live`, `status`, `alert` or `log`

## Steps observed in the app

| #   | Action            | Observed result         |
| --- | ----------------- | ----------------------- |
| 1   | Inspect the count | No live-region ancestor |

## Related cases

STATUSBAR-003.
