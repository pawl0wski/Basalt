# WINDOW-001 — Shows a title bar without title text and with Minimize, Maximize and Close window buttons when the app starts

| Field          | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-001                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                            |
| Requirement    | [Window shell, decision 9](../../specs/implemented/2026-10-30-design-system-window-shell.md)                                                                                                  |
| Implementation | [`basalt-app/e2e/window.spec.ts`](../../../basalt-app/e2e/window.spec.ts) — `"shows a title bar without title text and with Minimize, Maximize and Close window buttons when the app starts"` |
| Run            | `npx playwright test --grep @WINDOW-001` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                              |

## Scenario

Given the app is open on the Welcome screen
When the title bar is shown
Then the banner named `Window title bar` is visible with no `Basalt` text
And it offers Minimize window, Maximize window and Close window

## Steps observed in the app

| #   | Action       | Observed result               |
| --- | ------------ | ----------------------------- |
| 1   | Open the app | Bar with three window buttons |

## Related cases

WINDOW-002 to WINDOW-005.
