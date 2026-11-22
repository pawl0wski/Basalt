# IMAGES-019 — Saves the width only on the image that was resized when two images share a line

| Field          | Value                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-019                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                        |
| Priority       | Medium                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                            |
| Requirement    | [AC-12.1](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                                                                    |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"saves the width only on the image that was resized when two images share a line"` |
| Run            | `npx playwright test --grep @IMAGES-019` (from `basalt-app/`)                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                              |

## Scenario

Given a line holds `![first|120](pic.png) ![second|120](pic.png)`
And the clock is frozen
When the owner focuses the first image's handle and presses ArrowRight
Then the file holds `![first|130](pic.png) ![second|120](pic.png)`

## Steps observed in the app

| #   | Action                     | Observed result |
| --- | -------------------------- | --------------- |
| 1   | ArrowRight on first handle | First width 130 |
| 2   | Advance 1 000 ms           | Saved           |

## Related cases

IMAGES-022.
