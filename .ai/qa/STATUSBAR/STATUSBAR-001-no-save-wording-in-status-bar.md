# STATUSBAR-001 — Shows only the word count and no save or sync wording in the status bar before and after autosave runs

| Field          | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | STATUSBAR-001                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                                 |
| Priority       | Medium                                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                                     |
| Requirement    | [AC-07.2 and AC-07.5](../../specs/implemented/2026-11-17-status-bar-word-count.md)                                                                                                     |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"shows only the word count and no save or sync wording in the status bar before and after autosave runs"` |
| Run            | `npx playwright test --grep @STATUSBAR-001` (from `basalt-app/`)                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                       |

## Scenario

Given a workspace with note `a` containing `x`, open in a tab
And the clock is frozen
When the owner types ` y` and the autosave delay passes
Then the status bar reads `2 words` and contains no `saved`, `saving` or `sync` both while the note is unsaved and after it is saved

## Steps observed in the app

| #   | Action                     | Observed result                              |
| --- | -------------------------- | -------------------------------------------- |
| 1   | Type ` y`                  | Tab named `a not saved`; bar reads `2 words` |
| 2   | Advance the clock 1 000 ms | Tab named `a`; bar reads `2 words`           |

## Related cases

Word-count scenarios live in `status-bar.spec.ts`. The status bar has no accessible role, so the test locates it by its `bs-status-bar` class.
