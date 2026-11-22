# IMAGES-018 — Reveals the resize handle when the caret enters the image line and hides it when the caret leaves

| Field          | Value                                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-018                                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                                          |
| Priority       | Medium                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                              |
| Requirement    | [AC-12.1](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                                                                                      |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"reveals the resize handle when the caret enters the image line and hides it when the caret leaves"` |
| Run            | `npx playwright test --grep @IMAGES-018` (from `basalt-app/`)                                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                                                |

## Scenario

Given an image is shown in a note
When the caret enters and leaves the image line
Then the handle has opacity 0 first, 1 with the caret on the line and 0 again after leaving

## Steps observed in the app

| #   | Action               | Observed result |
| --- | -------------------- | --------------- |
| 1   | Open                 | opacity 0       |
| 2   | Click the image line | opacity 1       |
| 3   | ArrowUp              | opacity 0       |

## Related cases

The hover case of AC-12.1 is not covered.
