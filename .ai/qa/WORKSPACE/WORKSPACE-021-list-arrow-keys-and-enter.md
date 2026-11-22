# WORKSPACE-021 — Moves focus with the arrow keys and selects the focused note with Enter

| Field          | Value                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-021                                                                                                                                                 |
| Status         | Active                                                                                                                                                        |
| Priority       | Medium                                                                                                                                                        |
| Type           | UI                                                                                                                                                            |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                              |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"moves focus with the arrow keys and selects the focused note with Enter"` |
| Run            | `npx playwright test --grep @WORKSPACE-021` (from `basalt-app/`)                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                              |

## Scenario

Given notes `a`, `b`, `c` exist and `a` has focus
When the owner presses ArrowDown twice, ArrowUp once and Enter
Then focus moves `b`, `c`, `b` and `b` becomes selected

## Steps observed in the app

| #   | Action         | Observed result |
| --- | -------------- | --------------- |
| 1   | ArrowDown      | b focused       |
| 2   | ArrowDown      | c focused       |
| 3   | ArrowUp, Enter | b selected      |

## Related cases

Blocker: no requirement for tree keyboard navigation.
