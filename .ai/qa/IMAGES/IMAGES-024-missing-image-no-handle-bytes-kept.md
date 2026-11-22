# IMAGES-024 — Shows the placeholder without a handle and keeps the note bytes when the image with a stored width is missing

| Field          | Value                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-024                                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                                      |
| Priority       | Medium                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                          |
| Requirement    | [AC-12.3](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                                                                                                  |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"shows the placeholder without a handle and keeps the note bytes when the image with a stored width is missing"` |
| Run            | `npx playwright test --grep @IMAGES-024` (from `basalt-app/`)                                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                                            |

## Scenario

Given a note links the missing `missing.png` with width 300
When the owner opens it
Then the not-found placeholder is shown without a handle
And the note bytes are unchanged

## Steps observed in the app

| #   | Action | Observed result        |
| --- | ------ | ---------------------- |
| 1   | Open   | Placeholder; no handle |

## Related cases

IMAGES-003. The case that the width applies once the file appears is not covered.
