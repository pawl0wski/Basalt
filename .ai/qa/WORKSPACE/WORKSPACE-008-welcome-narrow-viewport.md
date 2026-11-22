# WORKSPACE-008 — Keeps the Open folder as workspace button in view and the page free of horizontal scrolling on a 360 px wide viewport

| Field          | Value                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-008                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                                      |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                                                        |
| Implementation | [`basalt-app/e2e/welcome.spec.ts`](../../../basalt-app/e2e/welcome.spec.ts) — `"keeps the Open folder as workspace button in view and the page free of horizontal scrolling on a 360 px wide viewport"` |
| Run            | `npx playwright test --grep @WORKSPACE-008` (from `basalt-app/`)                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                        |

## Scenario

Given the viewport is 360 px wide and 740 px high
When the Welcome screen is shown
Then the Open folder as workspace button is in the viewport
And the page is not wider than the viewport

## Steps observed in the app

| #   | Action            | Observed result                        |
| --- | ----------------- | -------------------------------------- |
| 1   | Resize to 360x740 | Button in view; no horizontal overflow |

## Related cases

Blocker: mobile layout is parked in epic E04; confirm whether a narrow desktop window is a requirement now.
