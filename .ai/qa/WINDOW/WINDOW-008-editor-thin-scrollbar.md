# WINDOW-008 — Gives the editor scroller the thin scrollbar treatment when a long note is open

| Field          | Value                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-008                                                                                                                                                            |
| Status         | Active                                                                                                                                                                |
| Priority       | Low                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                    |
| Requirement    | [AC-09.4](../../specs/implemented/2026-11-17-scrolling-model.md)                                                                                                      |
| Implementation | [`basalt-app/e2e/scrolling.spec.ts`](../../../basalt-app/e2e/scrolling.spec.ts) — `"gives the editor scroller the thin scrollbar treatment when a long note is open"` |
| Run            | `npx playwright test --grep @WINDOW-008` (from `basalt-app/`)                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                      |

## Scenario

Given a long note is open
When the editor scroller style is read
Then its scrollbar width is `thin`

## Steps observed in the app

| #   | Action        | Observed result |
| --- | ------------- | --------------- |
| 1   | Open the note | thin            |

## Related cases

AC-09.4 per-platform scrollbar rendering is not covered.
