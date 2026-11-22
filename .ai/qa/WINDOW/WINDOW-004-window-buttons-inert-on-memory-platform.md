# WINDOW-004 — Keeps the Welcome screen displayed when the window buttons are clicked on the memory platform

| Field          | Value                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-004                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                        |
| Priority       | Low                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                            |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                              |
| Implementation | [`basalt-app/e2e/window.spec.ts`](../../../basalt-app/e2e/window.spec.ts) — `"keeps the Welcome screen displayed when the window buttons are clicked on the memory platform"` |
| Run            | `npx playwright test --grep @WINDOW-004` (from `basalt-app/`)                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                              |

## Scenario

Given the app is open on the memory platform
When the owner clicks Minimize, Maximize and Close window
Then the Welcome heading is still shown

## Steps observed in the app

| #   | Action                  | Observed result          |
| --- | ----------------------- | ------------------------ |
| 1   | Click the three buttons | Welcome screen unchanged |

## Related cases

Tests the fake platform only; real window behaviour is not covered (see PLATFORM).
