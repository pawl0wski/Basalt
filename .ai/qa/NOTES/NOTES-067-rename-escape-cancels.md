# NOTES-067 — Cancels the rename, changes nothing and returns focus to the row when Escape is pressed in the dialog

| Field          | Value                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-067                                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                                            |
| Priority       | Medium                                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                                |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                         |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"cancels the rename, changes nothing and returns focus to the row when Escape is pressed in the dialog"` |
| Run            | `npx playwright test --grep @NOTES-067` (from `basalt-app/`)                                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                                  |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And the Rename dialog is open for `Ideas` with `zzz` typed
When the owner presses Escape
Then the dialog closes and the files are unchanged
And focus returns to the `Ideas` row

## Steps observed in the app

| #   | Action       | Observed result                             |
| --- | ------------ | ------------------------------------------- |
| 1   | Press Escape | Dialog closed; row focused; files unchanged |

## Related cases

NOTES-059.
