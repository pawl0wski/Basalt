# EDITOR-022 — Recreates the file with the typed text and clears the banner when Save again here is chosen

| Field          | Value                                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-022                                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                              |
| Requirement    | [Edge cases — File deleted or moved externally while open](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (Save again here recreates)                                            |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"recreates the file with the typed text and clears the banner when Save again here is chosen"` |
| Run            | `npx playwright test --grep @EDITOR-022` (from `basalt-app/`)                                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                                                |

## Scenario

Given the deleted-file banner is shown for a dirty note
When the owner chooses Save again here
Then the banner disappears and the tab is saved
And the file holds `base mine`

## Steps observed in the app

| #   | Action                 | Observed result            |
| --- | ---------------------- | -------------------------- |
| 1   | Choose Save again here | No alert; file `base mine` |

## Related cases

EDITOR-021.
