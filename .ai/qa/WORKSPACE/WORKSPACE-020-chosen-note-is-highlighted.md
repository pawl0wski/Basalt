# WORKSPACE-020 — Highlights the chosen note and not the others when a note is chosen in the list

| Field          | Value                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-020                                                                                                                                                         |
| Status         | Active                                                                                                                                                                |
| Priority       | Medium                                                                                                                                                                |
| Type           | UI                                                                                                                                                                    |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                      |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"highlights the chosen note and not the others when a note is chosen in the list"` |
| Run            | `npx playwright test --grep @WORKSPACE-020` (from `basalt-app/`)                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                      |

## Scenario

Given notes `a` and `b` exist
When the owner chooses `b`
Then `b` is selected and `a` is not

## Steps observed in the app

| #   | Action   | Observed result |
| --- | -------- | --------------- |
| 1   | Choose b | b selected      |

## Related cases

Blocker: selection highlight has no requirement beyond the tree design.
