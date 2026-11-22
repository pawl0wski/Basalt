# IMAGES-010 — Writes a link relative to the note when an image is pasted into a note in a sub-folder

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | IMAGES-010                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [Data model — links relative to the note](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                               |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"writes a link relative to the note when an image is pasted into a note in a sub-folder"` |
| Run            | `npx playwright test --grep @IMAGES-010` (from `basalt-app/`)                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given note `Projects/Plan` is open
And the clock is frozen
When the owner pastes `shot.png` and the autosave delay passes
Then `Projects/Plan.md` holds `![shot](../attachments/shot.png)`
And `attachments/shot.png` holds the bytes

## Steps observed in the app

| #   | Action           | Observed result          |
| --- | ---------------- | ------------------------ |
| 1   | Paste            | Link inserted            |
| 2   | Advance 1 000 ms | Saved with relative link |

## Related cases

IMAGES-002.
