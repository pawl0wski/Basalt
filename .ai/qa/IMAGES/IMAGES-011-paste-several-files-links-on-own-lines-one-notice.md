# IMAGES-011 — Inserts two image links on their own lines and shows one notice for the PDF when two images and a PDF are pasted in the middle of a line

| Field          | Value                                                                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-011                                                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                                                               |
| Requirement    | [Edge cases — Several files dropped in the middle of a line](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                                              |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"inserts two image links on their own lines and shows one notice for the PDF when two images and a PDF are pasted in the middle of a line"` |
| Run            | `npx playwright test --grep @IMAGES-011` (from `basalt-app/`)                                                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                 |

## Scenario

Given note `a` contains `left right` with the cursor after `left`
And the clock is frozen
When the owner pastes `one.png`, `doc.pdf` and `two.png`
Then two previews appear and `a.md` holds the two links on their own lines between `left` and ` right`
And one notice says `1 file was not added: This file format is not supported.`
And only `a.md`, `attachments/one.png` and `attachments/two.png` exist

## Steps observed in the app

| #   | Action            | Observed result            |
| --- | ----------------- | -------------------------- |
| 1   | Paste three files | Two previews; one notice   |
| 2   | Advance 1 000 ms  | Text and files as expected |

## Related cases

IMAGES-012.
