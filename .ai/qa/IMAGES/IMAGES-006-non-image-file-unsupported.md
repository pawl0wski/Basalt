# IMAGES-006 — Shows the format-not-supported placeholder when the linked file is not an image

| Field          | Value                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-006                                                                                                                                                      |
| Status         | Active                                                                                                                                                          |
| Priority       | Medium                                                                                                                                                          |
| Type           | UI                                                                                                                                                              |
| Requirement    | [Edge cases — Not an image, or HEIC, or a renamed non-image `.png`](../../specs/implemented/2026-10-25-images-in-notes.md)                                      |
| Implementation | [`basalt-app/e2e/images.spec.ts`](../../../basalt-app/e2e/images.spec.ts) — `"shows the format-not-supported placeholder when the linked file is not an image"` |
| Run            | `npx playwright test --grep @IMAGES-006` (from `basalt-app/`)                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                |

## Scenario

Given a note links `attachments/fake.png`, which holds plain text
When the owner opens the note
Then the text `Format not supported` is shown

## Steps observed in the app

| #   | Action        | Observed result         |
| --- | ------------- | ----------------------- |
| 1   | Open the note | Unsupported placeholder |

## Related cases

IMAGES-005.
