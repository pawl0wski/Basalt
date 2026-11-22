# SAVING-005 — Saves the typed text and clears the alert when Retry is used after the workspace is writable again

| Field          | Value                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-005                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                             |
| Priority       | High                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                 |
| Requirement    | [Edge cases — Directory not writable](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"saves the typed text and clears the alert when Retry is used after the workspace is writable again"` |
| Run            | `npx playwright test --grep @SAVING-005` (from `basalt-app/`)                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                   |

## Scenario

Given a workspace opened read-only containing note `a` with the text `base`
And the owner typed `!` and the alert is shown
And the workspace has become writable
When the owner chooses Retry
Then the alert disappears
And the tab is named `a` and the file holds exactly `base!`

## Steps observed in the app

| #   | Action                      | Observed result                 |
| --- | --------------------------- | ------------------------------- |
| 1   | Make the workspace writable | No visible change               |
| 2   | Choose Retry in the alert   | No alert; tab `a`; file `base!` |

## Related cases

SAVING-003, SAVING-004.
