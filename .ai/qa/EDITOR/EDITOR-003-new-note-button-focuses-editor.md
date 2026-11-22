# EDITOR-003 — Focuses the editor of the new Untitled note so typing starts at once when New note is used

| Field          | Value                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-003                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                     |
| Priority       | High                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                         |
| Requirement    | [AC-01.10](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                   |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"focuses the editor of the new Untitled note so typing starts at once when New note is used"` |
| Run            | `npx playwright test --grep @EDITOR-003` (from `basalt-app/`)                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                           |

## Scenario

Given a workspace with note `a`
And the clock is frozen
When the owner chooses New note in the title bar and types `typed at once`
Then the editor of `Untitled` was focused before typing
And after the autosave delay `Untitled.md` holds `# typed at once`

## Steps observed in the app

| #   | Action                    | Observed result                       |
| --- | ------------------------- | ------------------------------------- |
| 1   | Choose New note           | Editor `Untitled` focused             |
| 2   | Type and advance 1 000 ms | `Untitled.md` holds `# typed at once` |

## Related cases

EDITOR-004 (Ctrl+N). Read-only workspace case is in manage-notes.
