# WINDOW-009 — Scrolls the Welcome view in its own focusable region and not in the shell on a short narrow window

| Field          | Value                                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-009                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                               |
| Priority       | Medium                                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                                   |
| Requirement    | [AC-09.5](../../specs/implemented/2026-11-17-scrolling-model.md), [AC-09.7](../../specs/implemented/2026-11-17-scrolling-model.md), [AC-09.9](../../specs/implemented/2026-11-17-scrolling-model.md) |
| Implementation | [`basalt-app/e2e/scrolling.spec.ts`](../../../basalt-app/e2e/scrolling.spec.ts) — `"scrolls the Welcome view in its own focusable region and not in the shell on a short narrow window"`             |
| Run            | `npx playwright test --grep @WINDOW-009` (from `basalt-app/`)                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                     |

## Scenario

Given the viewport is 360 by 300 and the Welcome screen is shown
When the layout is inspected and Tab is pressed twice
Then the Welcome root scrolls with `overflow-y: auto` and `main` does not
And the page has no horizontal scrolling
And the scroller is focusable (`tabindex=0`)

## Steps observed in the app

| #   | Action    | Observed result        |
| --- | --------- | ---------------------- |
| 1   | Inspect   | Root scrolls; main not |
| 2   | Tab twice | Scroller focusable     |

## Related cases

WORKSPACE-008.
