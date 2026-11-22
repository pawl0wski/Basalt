# FORMATTING-003 — Leaves the text and the undo history untouched when Ctrl+B and Ctrl+I are pressed with a whitespace-only selection

| Field          | Value                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FORMATTING-003                                                                                                                                                                                             |
| Status         | Active                                                                                                                                                                                                     |
| Priority       | Medium                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                         |
| Requirement    | [AC-11.9](../../specs/implemented/2026-11-17-bold-italic-shortcuts.md)                                                                                                                                     |
| Implementation | [`basalt-app/e2e/formatting.spec.ts`](../../../basalt-app/e2e/formatting.spec.ts) — `"leaves the text and the undo history untouched when Ctrl+B and Ctrl+I are pressed with a whitespace-only selection"` |
| Run            | `npx playwright test --grep @FORMATTING-003` (from `basalt-app/`)                                                                                                                                          |
| Review         | AI draft — awaiting human review                                                                                                                                                                           |

## Scenario

Given note `a   b` is open and the three spaces are partly selected
When the owner presses Ctrl+B and Ctrl+I and then Ctrl+Z
Then the line stays `a   b` after each step, so no markers and no undo entry were added

## Steps observed in the app

| #   | Action                        | Observed result |
| --- | ----------------------------- | --------------- |
| 1   | Select spaces, Ctrl+B, Ctrl+I | Unchanged       |
| 2   | Ctrl+Z                        | Unchanged       |

## Related cases

FORMATTING-001.
