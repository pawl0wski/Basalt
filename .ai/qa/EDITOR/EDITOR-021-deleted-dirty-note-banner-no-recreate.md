# EDITOR-021 — Shows the deleted-file banner, keeps the typed text and does not recreate the file when a dirty note is deleted on disk

| Field          | Value                                                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-021                                                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                                                          |
| Requirement    | [Edge cases — File deleted or moved externally while open](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                    |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"shows the deleted-file banner, keeps the typed text and does not recreate the file when a dirty note is deleted on disk"` |
| Run            | `npx playwright test --grep @EDITOR-021` (from `basalt-app/`)                                                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                                                            |

## Scenario

Given note `a` containing `base` is open with ` mine` typed and not saved
And the clock is frozen
When the file is deleted outside the app and the watcher debounce passes
Then a banner says `This note was deleted or moved` and `Saving is paused`
And after 2 000 ms the file still does not exist and the editor keeps `base mine`

## Steps observed in the app

| #   | Action                      | Observed result        |
| --- | --------------------------- | ---------------------- |
| 1   | Delete a.md, advance 300 ms | Deleted banner         |
| 2   | Advance 2 000 ms            | File absent; text kept |

## Related cases

EDITOR-022 to EDITOR-025.
