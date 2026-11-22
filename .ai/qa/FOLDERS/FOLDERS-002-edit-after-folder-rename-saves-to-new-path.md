# FOLDERS-002 — Saves later typing to the renamed folder when a folder holding the open note is renamed

| Field          | Value                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-002                                                                                                                                                               |
| Status         | Active                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                        |
| Requirement    | [AC-05.1](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                               |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"saves later typing to the renamed folder when a folder holding the open note is renamed"` |
| Run            | `npx playwright test --grep @FOLDERS-002` (from `basalt-app/`)                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                          |

## Scenario

Given folder `d` holds the open note `a` containing `start` and is renamed to `e`
And the clock is frozen
When the owner types `!` and the autosave delay passes
Then `e/a.md` holds `start!`

## Steps observed in the app

| #   | Action                   | Observed result |
| --- | ------------------------ | --------------- |
| 1   | Rename d to e            | Tab follows     |
| 2   | Type !, advance 1 000 ms | e/a.md saved    |

## Related cases

FOLDERS-001.
