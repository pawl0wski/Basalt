# IMAGES-015 — Pastes the text and adds no file when the clipboard holds text together with an image rendition

| Field          | Value                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-015                                                                                                                                                                              |
| Status         | Active                                                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                      |
| Requirement    | [Edge cases — Clipboard has text and an image](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                   |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"pastes the text and adds no file when the clipboard holds text together with an image rendition"` |
| Run            | `npx playwright test --grep @IMAGES-015` (from `basalt-app/`)                                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                                        |

## Scenario

Given an empty note is open
When the owner pastes a clipboard holding `plain words` and an image rendition
Then the editor contains `plain words` and no file is added

## Steps observed in the app

| #   | Action                | Observed result |
| --- | --------------------- | --------------- |
| 1   | Paste text with image | Text only       |

## Related cases

IMAGES-008.
