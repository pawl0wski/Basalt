# IMAGES-017 — Inserts the link and writes the file when an image is dropped on the empty area far below the text of an empty note

| Field          | Value                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-017                                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                                      |
| Priority       | Medium                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                          |
| Requirement    | [UI/UX — editor fills the pane](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                                                      |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"inserts the link and writes the file when an image is dropped on the empty area far below the text of an empty note"` |
| Run            | `npx playwright test --grep @IMAGES-017` (from `basalt-app/`)                                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                                            |

## Scenario

Given an empty note fills at least 70 % of the pane height
And the clock is frozen
When the owner drops `low.png` near the bottom of the editor
Then the drop is handled inside the editor
And one preview appears, `attachments/low.png` holds the bytes and `a.md` holds `![low](attachments/low.png)`

## Steps observed in the app

| #   | Action               | Observed result       |
| --- | -------------------- | --------------------- |
| 1   | Drop near the bottom | Handled in the editor |
| 2   | Advance 1 000 ms     | Saved                 |

## Related cases

IMAGES-012.
