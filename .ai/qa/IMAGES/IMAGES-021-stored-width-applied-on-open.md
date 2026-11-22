# IMAGES-021 — Renders the image at its stored width and keeps the alt text and the file unchanged when a note with a width suffix is opened

| Field          | Value                                                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-021                                                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                                                          |
| Requirement    | [AC-12.2](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                                                                                                                  |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"renders the image at its stored width and keeps the alt text and the file unchanged when a note with a width suffix is opened"` |
| Run            | `npx playwright test --grep @IMAGES-021` (from `basalt-app/`)                                                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                                                            |

## Scenario

Given a note links `pic.png` with a stored width of 300
When the owner opens the note
Then the image renders 300 px wide with alt `pic`
And the file is unchanged

## Steps observed in the app

| #   | Action | Observed result        |
| --- | ------ | ---------------------- |
| 1   | Open   | 300 px; file unchanged |

## Related cases

IMAGES-023.
