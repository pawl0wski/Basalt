# FORMATTING-004 — Unwraps a selection that includes its markers and restores it in one Undo step when Ctrl+B is pressed

| Field          | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FORMATTING-004                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                            |
| Requirement    | [AC-11.4](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md), [AC-11.10](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md)                                               |
| Implementation | [`basalt-app/e2e/formatting.spec.ts`](../../../basalt-app/e2e/formatting.spec.ts) — `"unwraps a selection that includes its markers and restores it in one Undo step when Ctrl+B is pressed"` |
| Run            | `npx playwright test --grep @FORMATTING-004` (from `basalt-app/`)                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                              |

## Scenario

Given note `**word**` is open with the editor focused
When the owner selects all, presses Ctrl+B and then Ctrl+Z
Then the line shows `word` after Ctrl+B and `**word**` after the undo

## Steps observed in the app

| #   | Action         | Observed result |
| --- | -------------- | --------------- |
| 1   | Ctrl+A, Ctrl+B | word            |
| 2   | Ctrl+Z         | **word**        |

## Related cases

FORMATTING-001.
