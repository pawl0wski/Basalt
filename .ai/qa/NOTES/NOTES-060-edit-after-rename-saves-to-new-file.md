# NOTES-060 — Saves later typing to the renamed file when a note is renamed and then edited

| Field          | Value                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-060                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                        |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                 |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"saves later typing to the renamed file when a note is renamed and then edited"` |
| Run            | `npx playwright test --grep @NOTES-060` (from `basalt-app/`)                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                          |

## Scenario

Given note `a` containing `start` is open and renamed to `b`
And the clock is frozen
When the owner types `end` and the autosave delay passes
Then `b.md` holds `# b\n\nstartend` and it is the only file

## Steps observed in the app

| #   | Action                     | Observed result |
| --- | -------------------------- | --------------- |
| 1   | Rename a to b              | Tab b           |
| 2   | Type end, advance 1 000 ms | b.md saved      |

## Related cases

NOTES-059.
