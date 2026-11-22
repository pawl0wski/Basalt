# FOLDERS-006 — Saves unsaved text of a note inside the folder to the new path when the folder is renamed

| Field          | Value                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | FOLDERS-006                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                          |
| Requirement    | [AC-05.6](../../specs/implemented/2026-11-16-rename-move-delete-folders.md)                                                                                                 |
| Implementation | [`basalt-app/e2e/folders.spec.ts`](../../../basalt-app/e2e/folders.spec.ts) — `"saves unsaved text of a note inside the folder to the new path when the folder is renamed"` |
| Run            | `npx playwright test --grep @FOLDERS-006` (from `basalt-app/`)                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                            |

## Scenario

Given folder `d` holds the open note `a` with `+typed` appended after `base`
And the clock is frozen
When the owner renames `d` to `e`
Then `e/a.md` holds `base+typed`

## Steps observed in the app

| #   | Action        | Observed result             |
| --- | ------------- | --------------------------- |
| 1   | Type +typed   | Unsaved                     |
| 2   | Rename d to e | e/a.md holds the typed text |

## Related cases

Failed flush cancelling the rename is Vitest only.
