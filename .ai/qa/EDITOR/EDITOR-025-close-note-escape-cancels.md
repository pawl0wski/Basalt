# EDITOR-025 — Keeps the tab and the typed text when the Close note confirmation is cancelled with Escape

| Field          | Value                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-025                                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                             |
| Requirement    | [AC-01.14](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (Escape is Cancel)                                                                                                    |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"keeps the tab and the typed text when the Close note confirmation is cancelled with Escape"` |
| Run            | `npx playwright test --grep @EDITOR-025` (from `basalt-app/`)                                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                               |

## Scenario

Given the Close note confirmation is open for a deleted dirty note
When the owner presses Escape
Then the dialog is gone
And the tab and `base mine` are still there

## Steps observed in the app

| #   | Action       | Observed result                 |
| --- | ------------ | ------------------------------- |
| 1   | Press Escape | Dialog gone; one tab; text kept |

## Related cases

EDITOR-023.
