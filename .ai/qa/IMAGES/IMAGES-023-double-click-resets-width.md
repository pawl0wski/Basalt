# IMAGES-023 — Removes the width suffix and returns the image to its natural size when the handle is double-clicked

| Field          | Value                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-023                                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                                             |
| Priority       | Medium                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                                 |
| Requirement    | [AC-12.6](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                                                                                         |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"removes the width suffix and returns the image to its natural size when the handle is double-clicked"` |
| Run            | `npx playwright test --grep @IMAGES-023` (from `basalt-app/`)                                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                                   |

## Scenario

Given a note links `pic.png` with width 300
When the owner double-clicks the handle
Then the file holds `![pic](pic.png)` and the image is 120 px wide

## Steps observed in the app

| #   | Action                  | Observed result        |
| --- | ----------------------- | ---------------------- |
| 1   | Double-click the handle | Suffix removed; 120 px |

## Related cases

IMAGES-022.
