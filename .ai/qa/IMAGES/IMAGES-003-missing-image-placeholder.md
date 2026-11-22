# IMAGES-003 — Shows the image-not-found placeholder and leaves the note bytes unchanged when the linked image is missing

| Field          | Value                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | IMAGES-003                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                     |
| Priority       | High                                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                                         |
| Requirement    | [Edge cases — Image link to a missing file (AC3)](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                   |
| Implementation | [`basalt-app/e2e/images.spec.ts`](../../../basalt-app/e2e/images.spec.ts) — `"shows the image-not-found placeholder and leaves the note bytes unchanged when the linked image is missing"` |
| Run            | `npx playwright test --grep @IMAGES-003` (from `basalt-app/`)                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                           |

## Scenario

Given a note links `attachments/pic.png`, which does not exist
When the owner opens the note
Then the text `Image not found: attachments/pic.png` is shown and no image
And the note bytes are unchanged

## Steps observed in the app

| #   | Action        | Observed result              |
| --- | ------------- | ---------------------------- |
| 1   | Open the note | Placeholder; bytes unchanged |

## Related cases

IMAGES-004, IMAGES-024.
