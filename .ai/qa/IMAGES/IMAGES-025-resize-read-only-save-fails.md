# IMAGES-025 — Changes the text locally and shows the could-not-save alert when an image is resized in a read-only workspace

| Field          | Value                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-025                                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                                      |
| Priority       | Medium                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                          |
| Requirement    | [AC-12.9](../../specs/implemented/2026-11-17-resize-images-by-dragging.md)                                                                                                                                  |
| Implementation | [`basalt-app/e2e/resize-images.spec.ts`](../../../basalt-app/e2e/resize-images.spec.ts) — `"changes the text locally and shows the could-not-save alert when an image is resized in a read-only workspace"` |
| Run            | `npx playwright test --grep @IMAGES-025` (from `basalt-app/`)                                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                                            |

## Scenario

Given a read-only workspace with an image at width 300
And the clock is frozen
When the owner presses ArrowRight on the handle and the autosave delay passes
Then an alert says `Could not save the note`
And the editor still shows the note and the file holds the old text

## Steps observed in the app

| #   | Action                       | Observed result       |
| --- | ---------------------------- | --------------------- |
| 1   | ArrowRight, advance 1 000 ms | Alert; file unchanged |

## Related cases

SAVING-003.
