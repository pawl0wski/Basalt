# SAVING-004 — Keeps the alert and the typed text when Retry is used while the workspace is still read-only

| Field          | Value                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-004                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                       |
| Priority       | Medium                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                           |
| Requirement    | [Edge cases — Directory not writable](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                          |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"keeps the alert and the typed text when Retry is used while the workspace is still read-only"` |
| Run            | `npx playwright test --grep @SAVING-004` (from `basalt-app/`)                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                             |

## Scenario

Given a workspace opened read-only containing note `a` with the text `base`
And the owner typed `!` and the alert is shown
When the owner chooses Retry
Then the alert is still shown with the read-only message
And the tab is still `a not saved`, the editor shows `base!` and the file holds `base`

## Steps observed in the app

| #   | Action                    | Observed result                        |
| --- | ------------------------- | -------------------------------------- |
| 1   | Choose Retry in the alert | Alert stays; text `base!`; file `base` |

## Related cases

SAVING-003 (first failure), SAVING-005 (Retry succeeds). Idempotence: the repeated attempt changes nothing.
