# NOTES-075 — Names the new note after the typed title and keeps focus in the editor when a new note's heading is typed and committed

| Field          | Value                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-075                                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                                              |
| Requirement    | [AC-06.1](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                                                                                |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"names the new note after the typed title and keeps focus in the editor when a new note's heading is typed and committed"` |
| Run            | `npx playwright test --grep @NOTES-075` (from `basalt-app/`)                                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                                |

## Scenario

Given a workspace with note `a`
And the clock is frozen
When the owner presses Ctrl+N, types `Test` into the empty heading and presses Enter
Then the new note first shows the heading `# ` and the tab `Untitled`
And afterwards the tab and the row are `Test`, the files are `Test.md` and `a.md` and the editor keeps focus

## Steps observed in the app

| #   | Action           | Observed result               |
| --- | ---------------- | ----------------------------- |
| 1   | Ctrl+N           | Heading `# `; tab Untitled    |
| 2   | Type Test, Enter | Tab Test; Test.md; focus kept |

## Related cases

EDITOR-004, NOTES-076.
