# WORKSPACE-007 — Paints the Open folder as workspace button in the design system's primary action colour

| Field          | Value                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-007                                                                                                                                                             |
| Status         | Active                                                                                                                                                                    |
| Priority       | Medium                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                        |
| Requirement    | [Design system tokens — action-primary](../../../basalt-app/packages/ui/docs/design-system.md)                                                                            |
| Implementation | [`basalt-app/e2e/welcome.spec.ts`](../../../basalt-app/e2e/welcome.spec.ts) — `"paints the Open folder as workspace button in the design system's primary action colour"` |
| Run            | `npx playwright test --grep @WORKSPACE-007` (from `basalt-app/`)                                                                                                          |
| Review         | AI draft — awaiting human review                                                                                                                                          |

## Scenario

Given no workspace is open
When the app starts
Then the button's background equals the computed `--bs-action-primary` colour

## Steps observed in the app

| #   | Action                                      | Observed result           |
| --- | ------------------------------------------- | ------------------------- |
| 1   | Read the token colour and the button colour | Equal and not transparent |

## Related cases

WORKSPACE-006.
