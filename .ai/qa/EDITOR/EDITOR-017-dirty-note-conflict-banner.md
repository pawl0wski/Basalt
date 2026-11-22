# EDITOR-017 — Shows the conflict banner, keeps the typed text and never overwrites the disk text when a dirty note changes on disk

| Field          | Value                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | EDITOR-017                                                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                                                   |
| Priority       | High                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                       |
| Requirement    | [Edge cases — open note is dirty](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                          |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"shows the conflict banner, keeps the typed text and never overwrites the disk text when a dirty note changes on disk"` |
| Run            | `npx playwright test --grep @EDITOR-017` (from `basalt-app/`)                                                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                                                         |

## Scenario

Given note `a` containing `base` is open with ` mine` typed and not saved
And the clock is frozen
When the file is changed outside the app to `theirs` and the watcher debounce passes
Then a banner says `This note changed on disk` and `Saving is paused until you choose`
And the editor keeps `base mine` and the file keeps `theirs` even after 2 000 ms

## Steps observed in the app

| #   | Action                              | Observed result          |
| --- | ----------------------------------- | ------------------------ |
| 1   | Change a.md on disk, advance 300 ms | Conflict banner          |
| 2   | Advance 2 000 ms                    | Disk text still `theirs` |

## Related cases

EDITOR-018 to EDITOR-020 (resolutions), EDITOR-026 (layout).
