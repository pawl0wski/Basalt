# IMAGES-022 — Adjusts the stored width by 10 px, 50 px, to 40 px and to 2000 px with the arrow, Shift+arrow, Home and End keys and removes it with Delete

| Field          | Value                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-022                                                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                                                        |
| Requirement    | [AC-12.6](../../specs/implemented/2026-11-17-resize-images-by-dragging.md), [AC-12.7](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                                                    |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"adjusts the stored width by 10 px, 50 px, to 40 px and to 2000 px with the arrow, Shift+arrow, Home and End keys and removes it with Delete"` |
| Run            | `npx playwright test --grep @IMAGES-022` (from `basalt-app/`)                                                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                          |

## Scenario

Given a note links `pic.png` with width 300 and the handle has focus
And the clock is frozen
When the owner presses ArrowRight, Shift+ArrowLeft, Home, End and Delete
Then the stored width becomes 310, 260, 40, 2000 and finally the suffix is removed

## Steps observed in the app

| #   | Action          | Observed result |
| --- | --------------- | --------------- |
| 1   | ArrowRight      | 310             |
| 2   | Shift+ArrowLeft | 260             |
| 3   | Home            | 40              |
| 4   | End             | 2000            |
| 5   | Delete          | No suffix       |

## Related cases

IMAGES-023.
