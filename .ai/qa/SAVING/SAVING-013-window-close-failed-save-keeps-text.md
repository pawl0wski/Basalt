# SAVING-013 — Shows the save-failed dialog and keeps the typed text when the window Close button is used with a failing save

| Field          | Value                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-013                                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                             |
| Requirement    | [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and the Autosave rule (flush on window close)                                                                         |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"shows the save-failed dialog and keeps the typed text when the window Close button is used with a failing save"` |
| Run            | `npx playwright test --grep @SAVING-013` (from `basalt-app/`)                                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                               |

## Scenario

Given note `a` open with `typed` appended
And the next write will fail
When the owner uses the window Close button
Then the save-failed dialog appears
And after Cancel the dialog closes, the editor shows `basetyped` and the file holds `base`

## Steps observed in the app

| #   | Action                      | Observed result                            |
| --- | --------------------------- | ------------------------------------------ |
| 1   | Use the window Close button | Alert dialog                               |
| 2   | Choose Cancel               | Dialog gone; text `basetyped`; file `base` |

## Related cases

SAVING-012. The memory platform's window buttons are inert, so the real window closing is not covered (see PLATFORM).
