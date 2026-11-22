# IMAGES-020 — Stores the dragged width in the alt text and restores the previous width and file text when Undo is pressed

| Field          | Value                                                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-020                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                        |
| Requirement    | [AC-12.1](../../specs/implemented/2026-11-17-resize-images-by-dragging.md), [AC-12.4](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                    |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"stores the dragged width in the alt text and restores the previous width and file text when Undo is pressed"` |
| Run            | `npx playwright test --grep @IMAGES-020` (from `basalt-app/`)                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                          |

## Scenario

Given a note with an image at its natural width of 120 px
And the clock is frozen
When the owner drags the handle 100 px right and then presses Ctrl+Z in the editor
Then the image is wider than 200 px and the file holds a width suffix of 2 or 3 digits
And after Undo the file text is the original and the width is 120 px again

## Steps observed in the app

| #   | Action          | Observed result               |
| --- | --------------- | ----------------------------- |
| 1   | Drag the handle | Width above 200; suffix saved |
| 2   | Ctrl+Z, advance | Original text; 120 px         |

## Related cases

IMAGES-022.
