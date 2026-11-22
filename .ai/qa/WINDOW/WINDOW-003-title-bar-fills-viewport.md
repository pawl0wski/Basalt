# WINDOW-003 — Fills the viewport height with the title bar at the top and no page scrolling while the Welcome action stays enabled

| Field          | Value                                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-003                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                               |
| Priority       | Medium                                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                                   |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                                                     |
| Implementation | [`basalt-app/e2e/window.spec.ts`](../../../basalt-app/e2e/window.spec.ts) — `"fills the viewport height with the title bar at the top and no page scrolling while the Welcome action stays enabled"` |
| Run            | `npx playwright test --grep @WINDOW-003` (from `basalt-app/`)                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                     |

## Scenario

Given the app is open on the Welcome screen
When the layout is measured
Then the page does not scroll vertically and the app shell is as high as the viewport
And the title bar is at the top
And the Welcome action is enabled

## Steps observed in the app

| #   | Action           | Observed result         |
| --- | ---------------- | ----------------------- |
| 1   | Measure the page | No overflow; bar at y=0 |

## Related cases

Blocker: scrolling is specified in `2026-11-17-scrolling-model.md`; consider linking AC there.
