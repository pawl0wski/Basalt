# WORKSPACE-005 — Shows each product principle as its own headed article on the welcome screen

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-005                                                                                                                                                  |
| Status         | Active                                                                                                                                                         |
| Priority       | Low                                                                                                                                                            |
| Type           | UI                                                                                                                                                             |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                               |
| Implementation | [`basalt-app/e2e/welcome.spec.ts`](../../../basalt-app/e2e/welcome.spec.ts) — `"shows each product principle as its own headed article on the welcome screen"` |
| Run            | `npx playwright test --grep @WORKSPACE-005` (from `basalt-app/`)                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                               |

## Scenario

Given no workspace is open
When the app starts
Then the headed articles `Plain Markdown`, `Your workspace` and `Private by design` are shown and no other article exists

## Steps observed in the app

| #   | Action       | Observed result          |
| --- | ------------ | ------------------------ |
| 1   | Open the app | Three principle articles |

## Related cases

Blocker: the principle texts have no requirement; confirm against the product brief.
