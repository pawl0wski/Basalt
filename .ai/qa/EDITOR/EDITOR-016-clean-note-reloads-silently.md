# EDITOR-016 — Reloads the disk text silently without a banner when the open note is clean and changes on disk

| Field          | Value                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-016                                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                                              |
| Priority       | High                                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                                  |
| Requirement    | [Edge cases — open note is clean](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and [AC-07.1](../../specs/implemented/2026-11-17-status-bar-word-count.md)                          |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"reloads the disk text silently without a banner when the open note is clean and changes on disk"` |
| Run            | `npx playwright test --grep @EDITOR-016` (from `basalt-app/`)                                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                                    |

## Scenario

Given note `a` containing `base` is open and unchanged
And the clock is frozen
When the file is changed outside the app to `from disk` and the watcher debounce passes
Then the editor shows `from disk` and the status bar reads `2 words`
And no banner appears, the tab is saved and the file holds `from disk`

## Steps observed in the app

| #   | Action                              | Observed result                         |
| --- | ----------------------------------- | --------------------------------------- |
| 1   | Open a                              | Status bar `1 word`                     |
| 2   | Change a.md on disk, advance 300 ms | Editor `from disk`; `2 words`; no alert |

## Related cases

EDITOR-017 (dirty note).
