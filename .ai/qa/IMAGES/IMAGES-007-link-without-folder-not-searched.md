# IMAGES-007 — Shows the image-not-found placeholder for the link as written when it omits the attachments folder

| Field          | Value                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-007                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                             |
| Priority       | Medium                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                 |
| Requirement    | [Edge cases — Obsidian-style link without the folder](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                       |
| Implementation | [`basalt-app/e2e/images.spec.ts`](../../../basalt-app/e2e/images.spec.ts) — `"shows the image-not-found placeholder for the link as written when it omits the attachments folder"` |
| Run            | `npx playwright test --grep @IMAGES-007` (from `basalt-app/`)                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                   |

## Scenario

Given a note links `pic.png` while the file is `attachments/pic.png`
When the owner opens the note
Then the text `Image not found: pic.png` is shown

## Steps observed in the app

| #   | Action        | Observed result                   |
| --- | ------------- | --------------------------------- |
| 1   | Open the note | Not found for the link as written |

## Related cases

The edge-case table says it is resolved relative to the note; this test shows it is not searched in attachments. Confirm against the spec.
