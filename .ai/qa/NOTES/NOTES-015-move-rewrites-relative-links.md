# NOTES-015 — Rewrites relative image and note links and keeps other text when a note is moved to a folder

| Field          | Value                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-015                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                               |
| Priority       | High                                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                                   |
| Requirement    | [Decision C-7 — Image links on move](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                 |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"rewrites relative image and note links and keeps other text when a note is moved to a folder"` |
| Run            | `npx playwright test --grep @NOTES-015` (from `basalt-app/`)                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                     |

## Scenario

Given note `Gallery` links an image `attachments/one.png`, a web URL and `Other.md`
And folder `projects` exists
When the owner drops `Gallery` on `projects`
Then the note at `projects/Gallery.md` links `../attachments/one.png` and `../Other.md`
And the web link is unchanged and `Gallery.md` no longer exists

## Steps observed in the app

| #   | Action                     | Observed result          |
| --- | -------------------------- | ------------------------ |
| 1   | Drag Gallery onto projects | Relative links rewritten |

## Related cases

Links outside the workspace after a move are Vitest only.
