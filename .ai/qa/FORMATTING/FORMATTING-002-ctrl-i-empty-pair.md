# FORMATTING-002 — Inserts an empty italic pair with the cursor between and removes it with a second press when Ctrl+I is pressed without a selection

| Field          | Value                                                                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FORMATTING-002                                                                                                                                                                                                             |
| Status         | Active                                                                                                                                                                                                                     |
| Priority       | Medium                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                         |
| Requirement    | [AC-11.2](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md)                                                                                                                                                     |
| Implementation | [`basalt-app/e2e/formatting.spec.ts`](../../../basalt-app/e2e/formatting.spec.ts) — `"inserts an empty italic pair with the cursor between and removes it with a second press when Ctrl+I is pressed without a selection"` |
| Run            | `npx playwright test --grep @FORMATTING-002` (from `basalt-app/`)                                                                                                                                                          |
| Review         | AI draft — awaiting human review                                                                                                                                                                                           |

## Scenario

Given an empty note is open with the editor focused
When the owner presses Ctrl+I, types `x`, deletes it and presses Ctrl+I again
Then the line shows `**` after the first press and `*x*` after typing
And the second press leaves an empty line

## Steps observed in the app

| #   | Action            | Observed result |
| --- | ----------------- | --------------- |
| 1   | Ctrl+I            | Line `**`       |
| 2   | Type x            | Line `*x*`      |
| 3   | Backspace, Ctrl+I | Empty line      |

## Related cases

FORMATTING-003.
