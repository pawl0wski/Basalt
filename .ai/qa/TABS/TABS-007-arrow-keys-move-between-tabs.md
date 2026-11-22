# TABS-007 — Selects and focuses the neighbouring tab with the arrow, Home and End keys

| Field          | Value                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-007                                                                                                                                                   |
| Status         | Active                                                                                                                                                     |
| Priority       | Medium                                                                                                                                                     |
| Type           | UI                                                                                                                                                         |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                           |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"selects and focuses the neighbouring tab with the arrow, Home and End keys"` |
| Run            | `npx playwright test --grep @TABS-007` (from `basalt-app/`)                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                           |

## Scenario

Given tabs `a`, `b` and `c` are open and `c` has focus
When the owner presses ArrowLeft, Home, End and ArrowRight
Then each key selects and focuses the expected neighbour and shows its editor, wrapping from the last tab to the first

## Steps observed in the app

| #   | Action     | Observed result        |
| --- | ---------- | ---------------------- |
| 1   | ArrowLeft  | b focused and selected |
| 2   | Home       | a selected             |
| 3   | End        | c selected             |
| 4   | ArrowRight | a focused (wraps)      |

## Related cases

Blocker: no requirement for tab keyboard navigation; check the design system doc before review.
