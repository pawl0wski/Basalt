# IMAGES-004 — Switches the image to the not-found placeholder when it is deleted outside the app and back to the image when it returns

| Field          | Value                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-004                                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                                   |
| Priority       | High                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                       |
| Requirement    | [Edge cases — Image replaced or deleted on disk while shown](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                      |
| Implementation | [`basalt-app/e2e/images.spec.ts`](../../../basalt-app/e2e/images.spec.ts) — `"switches the image to the not-found placeholder when it is deleted outside the app and back to the image when it returns"` |
| Run            | `npx playwright test --grep @IMAGES-004` (from `basalt-app/`)                                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                                         |

## Scenario

Given a note containing `intro\n\n![pic](attachments/pic.png)\n\nend` and an existing image `attachments/pic.png`
When the image file is deleted outside the app and later written again
Then the placeholder appears after the deletion and the note is unchanged
And after it returns the image is shown and the placeholder is gone

## Steps observed in the app

| #   | Action                | Observed result |
| --- | --------------------- | --------------- |
| 1   | Delete the image      | Placeholder     |
| 2   | Write the image again | Image shown     |

## Related cases

IMAGES-003.
