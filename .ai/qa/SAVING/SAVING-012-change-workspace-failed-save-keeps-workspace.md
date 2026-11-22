# SAVING-012 — Shows the save-failed dialog and keeps the open workspace and text when changing workspace with a failing save

| Field          | Value                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-012                                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                             |
| Requirement    | [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and the Autosave rule (flush on workspace change)                                                                     |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"shows the save-failed dialog and keeps the open workspace and text when changing workspace with a failing save"` |
| Run            | `npx playwright test --grep @SAVING-012` (from `basalt-app/`)                                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                               |

## Scenario

Given note `a` open with `typed` appended
And a second workspace `/work/Other` is ready in the picker
And the next write will fail
When the owner presses Ctrl+O
Then the save-failed dialog appears
And the editor still shows `basetyped`
And after Escape the dialog closes and the original workspace and note are still shown

## Steps observed in the app

| #   | Action       | Observed result                             |
| --- | ------------ | ------------------------------------------- |
| 1   | Press Ctrl+O | Alert dialog; editor text `basetyped`       |
| 2   | Press Escape | Dialog gone; note `a` still listed and open |

## Related cases

SAVING-013 (window close). Not covered: Discard and Retry from this entry point, which share the dialog with SAVING-009 and SAVING-010.
