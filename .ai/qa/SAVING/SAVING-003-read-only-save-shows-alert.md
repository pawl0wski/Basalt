# SAVING-003 — Shows the could-not-save alert and keeps the typed text and the unsaved tab when the workspace is read-only

| Field          | Value                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-003                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                          |
| Requirement    | [Edge cases — Directory not writable](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (banner with Retry, text and dirty state kept)                                          |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"shows the could-not-save alert and keeps the typed text and the unsaved tab when the workspace is read-only"` |
| Run            | `npx playwright test --grep @SAVING-003` (from `basalt-app/`)                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                            |

## Scenario

Given a workspace opened read-only containing note `a` with the text `base`
And the clock is frozen
When the owner types `!` and the autosave delay passes
Then an alert says `Could not save the note` and shows the read-only message
And the tab is named `a not saved`, the editor shows `base!` and the file still holds `base`

## Steps observed in the app

| #   | Action                     | Observed result                                                    |
| --- | -------------------------- | ------------------------------------------------------------------ |
| 1   | Type `!`                   | Tab named `a not saved`                                            |
| 2   | Advance the clock 1 000 ms | Alert with the read-only message; editor text `base!`; file `base` |

## Related cases

SAVING-004, SAVING-005 (Retry). Not covered: failed write in a writable workspace (see SAVING-007 to SAVING-010).
