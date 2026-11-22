# EDITOR-023 — Asks before closing with Cancel focused and keeps the note when Cancel is chosen on a deleted dirty note

| Field          | Value                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | EDITOR-023                                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                                           |
| Requirement    | [AC-01.14](../../specs/2026-10-24-markdown-notes-and-app-foundations.md); [Edge cases — File deleted or moved externally](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                      |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"asks before closing with Cancel focused and keeps the note when Cancel is chosen on a deleted dirty note"` |
| Run            | `npx playwright test --grep @EDITOR-023` (from `basalt-app/`)                                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                                             |

## Scenario

Given the deleted-file banner is shown for a dirty note
When the owner chooses Close note and then Cancel
Then the confirmation names the deleted note and the lost changes and has Cancel focused
And after Cancel the tab and `base mine` are still there

## Steps observed in the app

| #   | Action            | Observed result                 |
| --- | ----------------- | ------------------------------- |
| 1   | Choose Close note | Dialog with Cancel focused      |
| 2   | Choose Cancel     | Dialog gone; one tab; text kept |

## Related cases

EDITOR-024, EDITOR-025.
