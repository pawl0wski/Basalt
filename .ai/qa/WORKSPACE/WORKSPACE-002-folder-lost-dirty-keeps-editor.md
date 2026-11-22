# WORKSPACE-002 — Keeps the editor, asks about the failed save first and then shows a banner with Retry and Change workspace when the folder is lost with unsaved text

| Field          | Value                                                                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-002                                                                                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                                                                                   |
| Priority       | High                                                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                                                       |
| Requirement    | [Edge cases — Workspace folder deleted/renamed while open](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and [AC-01.13](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                    |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"keeps the editor, asks about the failed save first and then shows a banner with Retry and Change workspace when the folder is lost with unsaved text"` |
| Run            | `npx playwright test --grep @WORKSPACE-002` (from `basalt-app/`)                                                                                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                                         |

## Scenario

Given note `a` containing `base` is open with ` mine` typed and not saved
And the clock is frozen
When the workspace folder is lost and the owner chooses Cancel in the save-failed dialog
Then the dialog says `Could not save "a"` with Cancel focused
And then a banner says the folder is not available and offers Retry and Change workspace
And the editor still shows `base mine`

## Steps observed in the app

| #   | Action                          | Observed result                                   |
| --- | ------------------------------- | ------------------------------------------------- |
| 1   | Remove the root, advance 300 ms | Save-failed dialog; Cancel focused                |
| 2   | Choose Cancel                   | Banner with Retry and Change workspace; text kept |

## Related cases

WORKSPACE-003 (Retry), SAVING-007.
