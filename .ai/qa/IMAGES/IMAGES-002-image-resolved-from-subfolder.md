# IMAGES-002 — Shows the image when a note in a sub-folder links it relative to itself

| Field          | Value                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-002                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                        |
| Priority       | Medium                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                            |
| Requirement    | [AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and [Data model — links relative to the note](../../specs/implemented/2026-10-25-images-in-notes.md) |
| Implementation | [`basalt-app/e2e/images.spec.ts`](../../../basalt-app/e2e/images.spec.ts) — `"shows the image when a note in a sub-folder links it relative to itself"`                       |
| Run            | `npx playwright test --grep @IMAGES-002` (from `basalt-app/`)                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                              |

## Scenario

Given note `Projects/Plan` links `../attachments/pic.png`
When the owner opens it
Then one image is shown

## Steps observed in the app

| #   | Action    | Observed result |
| --- | --------- | --------------- |
| 1   | Open Plan | One image       |

## Related cases

IMAGES-010 (adding from a sub-folder).
