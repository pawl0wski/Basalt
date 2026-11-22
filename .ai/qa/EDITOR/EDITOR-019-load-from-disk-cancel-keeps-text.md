# EDITOR-019 — Keeps the typed text and the disk text when the Load version from disk confirmation is cancelled with Escape

| Field          | Value                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-019                                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                                               |
| Requirement    | [AC-01.14](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (Initial focus and Escape on Cancel; Cancel keeps the text)                                                                             |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"keeps the typed text and the disk text when the Load version from disk confirmation is cancelled with Escape"` |
| Run            | `npx playwright test --grep @EDITOR-019` (from `basalt-app/`)                                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                                 |

## Scenario

Given the conflict banner is shown for a dirty note
When the owner chooses Load version from disk and presses Escape
Then the confirmation names the lost changes and has Cancel focused
And after Escape the dialog is gone, the editor keeps `base mine`, the banner stays and the file holds `theirs`

## Steps observed in the app

| #   | Action                        | Observed result                      |
| --- | ----------------------------- | ------------------------------------ |
| 1   | Choose Load version from disk | Dialog with Cancel focused           |
| 2   | Press Escape                  | Dialog gone; text kept; banner stays |

## Related cases

EDITOR-020 (confirm).
