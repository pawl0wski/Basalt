# FORMATTING-001 — Wraps the selection in bold markers, renders bold off the line, saves the markers and unwraps with a second press when Ctrl+B is pressed

| Field          | Value                                                                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FORMATTING-001                                                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                                                               |
| Requirement    | [AC-11.1](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md), [AC-11.5](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md), [AC-11.10](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md)          |
| Implementation | [`basalt-app/e2e/formatting.spec.ts`](../../../basalt-app/e2e/formatting.spec.ts) — `"wraps the selection in bold markers, renders bold off the line, saves the markers and unwraps with a second press when Ctrl+B is pressed"` |
| Run            | `npx playwright test --grep @FORMATTING-001` (from `basalt-app/`)                                                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                 |

## Scenario

Given note `a` containing `word\nnext` is open with the editor focused
And the clock is frozen
When the owner selects `word`, presses Ctrl+B, and later selects the line again and presses Ctrl+B
Then the first line shows `**word**` and renders bold once the cursor leaves it
And after the autosave delay the file holds `**word**\nnext`
And the second press restores `word` and the file holds `word\nnext`

## Steps observed in the app

| #   | Action                       | Observed result         |
| --- | ---------------------------- | ----------------------- |
| 1   | Select word, Ctrl+B          | Line shows **word**     |
| 2   | Click next line              | Strong text word        |
| 3   | Advance 1 000 ms             | File **word**           |
| 4   | Select line, Ctrl+B, advance | word restored and saved |

## Related cases

FORMATTING-004 (unwrap with markers selected).
