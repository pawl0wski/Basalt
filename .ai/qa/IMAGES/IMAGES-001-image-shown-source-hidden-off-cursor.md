# IMAGES-001 — Shows the linked image with its alt text and hides the link source off the cursor line, then shows the source on the cursor line without changing the file

| Field          | Value                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | IMAGES-001                                                                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                                                                     |
| Priority       | High                                                                                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                                                                                         |
| Requirement    | [AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and [UI/UX — Display](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                      |
| Implementation | [`basalt-app/e2e/images.spec.ts`](../../../basalt-app/e2e/images.spec.ts) — `"shows the linked image with its alt text and hides the link source off the cursor line, then shows the source on the cursor line without changing the file"` |
| Run            | `npx playwright test --grep @IMAGES-001` (from `basalt-app/`)                                                                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                           |

## Scenario

Given a note containing `intro\n\n![pic](attachments/pic.png)\n\nend` and an existing image `attachments/pic.png`
When the owner opens the note and then moves the cursor onto the link line
Then one image with alt `pic` and a non-zero natural width is shown and the link line is empty
And with the cursor on it the line shows `![pic](attachments/pic.png)`
And the file is unchanged

## Steps observed in the app

| #   | Action                     | Observed result              |
| --- | -------------------------- | ---------------------------- |
| 1   | Open the note              | Image shown; link line empty |
| 2   | Move the cursor down twice | Link source shown            |

## Related cases

IMAGES-002 to IMAGES-007.
