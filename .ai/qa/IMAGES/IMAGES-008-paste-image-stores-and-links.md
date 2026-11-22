# IMAGES-008 — Stores a pasted image in attachments, inserts a standard Markdown link and saves it when an image is pasted

| Field          | Value                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-008                                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                                              |
| Priority       | High                                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                                  |
| Requirement    | [Image paste and drop](../../specs/implemented/2026-10-25-images-in-notes.md) (Phase 2) and [AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"stores a pasted image in attachments, inserts a standard Markdown link and saves it when an image is pasted"` |
| Run            | `npx playwright test --grep @IMAGES-008` (from `basalt-app/`)                                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                                    |

## Scenario

Given an empty note `a` is open
And the clock is frozen
When the owner pastes an image `shot.png` and the autosave delay passes
Then one image preview appears and `a.md` holds `![shot](attachments/shot.png)`
And `attachments/shot.png` holds the pasted bytes
And the preview has a non-zero natural width and the link is in the editor text

## Steps observed in the app

| #   | Action           | Observed result         |
| --- | ---------------- | ----------------------- |
| 1   | Paste shot.png   | Preview shown           |
| 2   | Advance 1 000 ms | a.md saved; file stored |

## Related cases

IMAGES-009 to IMAGES-017.
