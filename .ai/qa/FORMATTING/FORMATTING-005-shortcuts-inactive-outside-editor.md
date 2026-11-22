# FORMATTING-005 — Changes nothing when Ctrl+B and Ctrl+I are pressed while the notes tree has focus

| Field          | Value                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FORMATTING-005                                                                                                                                                            |
| Status         | Active                                                                                                                                                                    |
| Priority       | Medium                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                        |
| Requirement    | [AC-11.11](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md)                                                                                                   |
| Implementation | [`basalt-app/e2e/formatting.spec.ts`](../../../basalt-app/e2e/formatting.spec.ts) — `"changes nothing when Ctrl+B and Ctrl+I are pressed while the notes tree has focus"` |
| Run            | `npx playwright test --grep @FORMATTING-005` (from `basalt-app/`)                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                          |

## Scenario

Given note `word` is open and the `a` row in the notes tree has focus
When the owner presses Ctrl+B and Ctrl+I
Then the note text stays `word`

## Steps observed in the app

| #   | Action                             | Observed result |
| --- | ---------------------------------- | --------------- |
| 1   | Focus the tree row, Ctrl+B, Ctrl+I | Text unchanged  |

## Related cases

FORMATTING-001. Dialogs and tabs are not covered; IME composition (AC-11.3) is Vitest only.
