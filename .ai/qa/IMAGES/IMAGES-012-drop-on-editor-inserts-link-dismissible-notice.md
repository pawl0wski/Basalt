# IMAGES-012 — Inserts the dropped image's link and lets the notice about the unsupported file be dismissed when files are dropped on the editor

| Field          | Value                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-012                                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                                        |
| Requirement    | [Edge cases — Several files dropped in the middle of a line](../../specs/implemented/2026-10-25-images-in-notes.md)                                                                                                       |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"inserts the dropped image's link and lets the notice about the unsupported file be dismissed when files are dropped on the editor"` |
| Run            | `npx playwright test --grep @IMAGES-012` (from `basalt-app/`)                                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                                          |

## Scenario

Given an empty note is open
When the owner drops `d.png` and `x.pdf` on the editor and dismisses the notice
Then the drop is handled and one preview appears
And a notice says `1 file was not added` and disappears after Dismiss notice

## Steps observed in the app

| #   | Action                | Observed result |
| --- | --------------------- | --------------- |
| 1   | Drop two files        | Preview; notice |
| 2   | Choose Dismiss notice | Notice gone     |

## Related cases

IMAGES-011, IMAGES-013.
