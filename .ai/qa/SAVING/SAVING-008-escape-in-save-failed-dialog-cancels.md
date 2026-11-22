# SAVING-008 — Keeps the tab and the typed text when Escape is pressed in the save-failed dialog

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-008                                                                                                                                                        |
| Status         | Active                                                                                                                                                            |
| Priority       | High                                                                                                                                                              |
| Type           | UI                                                                                                                                                                |
| Requirement    | [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (Escape means Cancel, never Discard)                                                     |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"keeps the tab and the typed text when Escape is pressed in the save-failed dialog"` |
| Run            | `npx playwright test --grep @SAVING-008` (from `basalt-app/`)                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                  |

## Scenario

Given the save-failed dialog is open for dirty note `a`
When the owner presses Escape
Then the dialog closes
And the tab is still named `a not saved`, the editor shows `basetyped` and the file holds `base`

## Steps observed in the app

| #   | Action       | Observed result                             |
| --- | ------------ | ------------------------------------------- |
| 1   | Press Escape | Dialog gone; tab and text kept; file `base` |

## Related cases

SAVING-009 (Discard).
