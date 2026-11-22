# WORKSPACE-006 — Gives the Open folder as workspace button a non-transparent background when the app is loaded

| Field          | Value                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-006                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                          |
| Priority       | Low                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                              |
| Requirement    | missing — no requirement in `.ai/specs/` covers this behaviour; owner to confirm                                                                                                |
| Implementation | [`basalt-app/e2e/welcome.spec.ts`](../../../basalt-app/e2e/welcome.spec.ts) — `"gives the Open folder as workspace button a non-transparent background when the app is loaded"` |
| Run            | `npx playwright test --grep @WORKSPACE-006` (from `basalt-app/`)                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                |

## Scenario

Given no workspace is open
When the app starts
Then the Open folder as workspace button has a background colour other than transparent

## Steps observed in the app

| #   | Action       | Observed result         |
| --- | ------------ | ----------------------- |
| 1   | Open the app | Button has a background |

## Related cases

WORKSPACE-007 covers the specific colour. Candidate to merge or retire at review.
