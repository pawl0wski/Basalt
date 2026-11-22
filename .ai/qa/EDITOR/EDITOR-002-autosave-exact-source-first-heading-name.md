# EDITOR-002 — Saves exactly the typed source under the first heading's file name once the autosave delay passes

| Field          | Value                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-002                                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                             |
| Requirement    | [AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (saved text equals typed source) and [AC-06.1](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md) |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"saves exactly the typed source under the first heading's file name once the autosave delay passes"`              |
| Run            | `npx playwright test --grep @EDITOR-002` (from `basalt-app/`)                                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                               |

## Scenario

Given an empty note `a` is open
And the clock is frozen
When the owner types a heading, a blank line, an emphasised line and a second line, and the autosave delay passes
Then the workspace holds one file `Title.md` whose bytes are exactly the typed source

## Steps observed in the app

| #   | Action                     | Observed result                            |
| --- | -------------------------- | ------------------------------------------ |
| 1   | Type the four lines        | Tab unsaved                                |
| 2   | Advance the clock 1 000 ms | Only `Title.md` exists with the typed text |

## Related cases

EDITOR-009 (formatted source). Rename edge cases (empty, colliding heading) belong to the note-title scenarios.
