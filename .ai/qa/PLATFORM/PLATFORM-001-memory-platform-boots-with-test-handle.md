# PLATFORM-001 — Starts on the memory platform with the Welcome action shown and the test file-system handle exposed

| Field          | Value                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | PLATFORM-001                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                      |
| Requirement    | [README — Running the app](../../../README.md)                                                                                                                                          |
| Implementation | [`basalt-app/e2e/platform.spec.ts`](../../../basalt-app/e2e/platform.spec.ts) — `"starts on the memory platform with the Welcome action shown and the test file-system handle exposed"` |
| Run            | `npx playwright test --grep @PLATFORM-001` (from `basalt-app/`)                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                        |

## Scenario

Given the dev server runs with `VITE_BASALT_PLATFORM=memory`
When the app is opened
Then the Welcome action is visible
And `window.__basaltTestFs` exists

## Steps observed in the app

| #   | Action       | Observed result                     |
| --- | ------------ | ----------------------------------- |
| 1   | Open the app | Welcome action; test handle present |

## Related cases

This scenario guards the test platform itself, not a product feature.
